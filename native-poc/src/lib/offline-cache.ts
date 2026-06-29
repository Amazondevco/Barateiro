import { Preferences } from "@capacitor/preferences";

// Cache de leitura para funcionar offline e tornar a navegação instantânea.
// Duas camadas:
//  - memória (Map): leitura SÍNCRONA → a tela já monta com o dado, sem spinner.
//  - Preferences: persiste entre sessões; aquecido para a memória no boot.

const PREFIX = "cache:";
const mem = new Map<string, unknown>();

function online() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

// Leitura síncrona da memória (usada para o estado inicial das telas).
export function peek<T>(key: string): T | null {
  return mem.has(key) ? (mem.get(key) as T) : null;
}

async function readCache<T>(key: string): Promise<T | null> {
  if (mem.has(key)) return mem.get(key) as T;
  try {
    const { value } = await Preferences.get({ key: PREFIX + key });
    if (!value) return null;
    const parsed = JSON.parse(value) as T;
    mem.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T) {
  mem.set(key, data);
  try {
    await Preferences.set({ key: PREFIX + key, value: JSON.stringify(data) });
  } catch {
    /* cota cheia / storage indisponível — ignora */
  }
}

// Carrega tudo que está em disco para a memória (chamado no boot), para que a
// primeira visita a cada aba já seja instantânea (peek encontra o dado).
export async function warmCache() {
  try {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(PREFIX))
        .map(async (k) => {
          const short = k.slice(PREFIX.length);
          if (mem.has(short)) return;
          const { value } = await Preferences.get({ key: k });
          if (!value) return;
          try {
            mem.set(short, JSON.parse(value));
          } catch {
            /* ignora entrada corrompida */
          }
        }),
    );
  } catch {
    /* ignora */
  }
}

// Cache-first (stale-while-revalidate): devolve o cache NA HORA (memória →
// disco) e revalida em segundo plano; quando o dado fresco chega, chama
// onRevalidate para a tela se atualizar. Sem cache, busca normal.
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onRevalidate?: (fresh: T) => void,
): Promise<T> {
  const cached = await readCache<T>(key);

  if (cached !== null) {
    if (online()) {
      void (async () => {
        try {
          const fresh = await fetcher();
          await writeCache(key, fresh);
          onRevalidate?.(fresh);
        } catch {
          /* sem rede / falha → mantém o cache exibido */
        }
      })();
    }
    return cached;
  }

  const fresh = await fetcher();
  void writeCache(key, fresh);
  return fresh;
}

// Limpa o cache (ex.: no logout, para não vazar dados entre contas).
export async function clearCache() {
  mem.clear();
  try {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(PREFIX))
        .map((k) => Preferences.remove({ key: k })),
    );
  } catch {
    /* ignora */
  }
}
