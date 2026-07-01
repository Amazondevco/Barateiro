import { supabase } from "./supabase";
import type { Lang } from "./i18n/i18n";

// Tradução do CONTEÚDO (nome/perguntas do checklist) para exibição no celular do
// operador. Guarda o resultado em cache local (localStorage) — cada texto é
// traduzido uma vez; depois é instantâneo e funciona offline. NÃO altera o banco:
// é só display. As respostas continuam como códigos (o admin vê no idioma dele).
const WEB_BASE = "https://check-ai-br.vercel.app";

function chaveCache(lang: Lang) {
  return `contentTx:${lang}`;
}

function lerCache(lang: Lang): Record<string, string> {
  try {
    const s = localStorage.getItem(chaveCache(lang));
    return s ? (JSON.parse(s) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function salvarCache(lang: Lang, mapa: Record<string, string>) {
  try {
    localStorage.setItem(chaveCache(lang), JSON.stringify(mapa));
  } catch {
    /* ignora (sem espaço) */
  }
}

// Traduz uma lista de textos PT para `lang`. Retorna um mapa ptText → tradução
// (para textos sem tradução, cai no próprio PT). Só chama a rede para o que
// ainda não está em cache.
export async function traduzirConteudo(
  textos: string[],
  lang: Lang,
): Promise<Record<string, string>> {
  const unicos = [...new Set(textos.filter((s) => s && s.trim()))];
  if (lang === "pt" || unicos.length === 0) {
    return Object.fromEntries(unicos.map((s) => [s, s]));
  }

  const cache = lerCache(lang);
  const faltando = unicos.filter((s) => !(s in cache));

  if (faltando.length > 0) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const res = await fetch(`${WEB_BASE}/api/traduzir`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ textos: faltando, lang }),
        });
        if (res.ok) {
          const json = (await res.json()) as { traducoes?: string[] };
          const trad = json?.traducoes ?? [];
          faltando.forEach((orig, i) => {
            cache[orig] = trad[i] ?? orig;
          });
          salvarCache(lang, cache);
        }
      }
    } catch {
      /* offline / falha → mantém o que tem; o resto cai no PT */
    }
  }

  return Object.fromEntries(unicos.map((s) => [s, cache[s] ?? s]));
}
