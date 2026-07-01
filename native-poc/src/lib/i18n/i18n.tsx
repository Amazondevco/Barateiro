import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { en } from "./en";
import { es } from "./es";

// i18n do app nativo — 100% OFFLINE e PRIVADO: os dicionários vêm embutidos no
// bundle e a preferência de idioma fica só no aparelho (localStorage). Nenhum
// texto do usuário é enviado para fora. O Português é a língua-fonte: a própria
// string PT é a "chave"; en/es mapeiam PT → tradução. Sem tradução → cai no PT.
export type Lang = "pt" | "en" | "es";

export const IDIOMAS: { v: Lang; label: string }[] = [
  { v: "pt", label: "Português" },
  { v: "en", label: "English" },
  { v: "es", label: "Español" },
];

const DICTS: Record<Lang, Record<string, string>> = { pt: {}, en, es };
const KEY = "checkai-lang";

export function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "es" || v === "pt") return v;
  } catch {
    /* ignore */
  }
  return "pt";
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (pt: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx>({
  lang: "pt",
  setLang: () => {},
  t: (s) => s,
});

function aplicar(
  lang: Lang,
  pt: string,
  vars?: Record<string, string | number>,
): string {
  let s = lang === "pt" ? pt : (DICTS[lang][pt] ?? pt);
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
    }
  }
  return s;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readLang());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang =
      l === "pt" ? "pt-BR" : l === "es" ? "es" : "en";
  }, []);

  const t = useCallback(
    (pt: string, vars?: Record<string, string | number>) =>
      aplicar(lang, pt, vars),
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  return useContext(I18nContext);
}
