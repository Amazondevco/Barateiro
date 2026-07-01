const routeAliases: Record<string, string> = {
  app: "/app",
  inicio: "/app",
  home: "/app",
  avisos: "/app/avisos",
  formularios: "/app/formularios",
  enviados: "/app/formularios",
  perfil: "/app/perfil",
  config: "/app/config",
  configuracoes: "/app/config",
};

function normalizePath(path: string) {
  const cleanedPath = path.replace(/^\/+/, "");

  if (!cleanedPath) {
    return "/app";
  }

  if (cleanedPath.startsWith("app/")) {
    return `/${cleanedPath}`;
  }

  return routeAliases[cleanedPath] ?? `/app/${cleanedPath}`;
}

// Domínio do PWA — os App Links (https) do convite chegam por aqui.
const WEB_HOST = "check-ai-br.vercel.app";

export function getRouteFromDeepLink(url: string) {
  try {
    const parsedUrl = new URL(url);

    // App Link https do convite (concluir cadastro / definir senha) → tela nativa.
    // Preserva a query (?convite=…&email=…&nome=…) para a página consumir.
    if (
      (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") &&
      parsedUrl.hostname === WEB_HOST &&
      parsedUrl.pathname.startsWith("/auth/redefinir")
    ) {
      return `/definir-senha${parsedUrl.search}`;
    }

    // Esquema custom checkai://…
    if (parsedUrl.protocol !== "checkai:") {
      return null;
    }

    const routeKey = [parsedUrl.hostname, parsedUrl.pathname].filter(Boolean).join("/");

    return normalizePath(routeKey);
  } catch {
    return null;
  }
}
