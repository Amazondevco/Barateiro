import { Preferences } from "@capacitor/preferences";

// Cache de leitura para funcionar offline: guarda o último resultado de cada
// consulta (memberships, home da rede, definição de formulário, perfil, avisos)
// e o devolve quando não há internet ou a consulta falha.

const PREFIX = "cache:";

function online() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const { value } = await Preferences.get({ key: PREFIX + key });
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T) {
  try {
    await Preferences.set({ key: PREFIX + key, value: JSON.stringify(data) });
  } catch {
    /* cota cheia / storage indisponível — ignora silenciosamente */
  }
}

// Network-first com fallback de cache. Offline, lê o cache direto (sem esperar
// a rede falhar). Online, busca fresco e atualiza o cache.
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!online()) {
    const cached = await readCache<T>(key);
    if (cached !== null) return cached;
  }
  try {
    const fresh = await fetcher();
    void writeCache(key, fresh);
    return fresh;
  } catch (err) {
    const cached = await readCache<T>(key);
    if (cached !== null) return cached;
    throw err;
  }
}

// Limpa o cache (ex.: no logout, para não vazar dados entre contas).
export async function clearCache() {
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
