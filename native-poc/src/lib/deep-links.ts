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

export function getRouteFromDeepLink(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "checkai:") {
      return null;
    }

    const routeKey = [parsedUrl.hostname, parsedUrl.pathname].filter(Boolean).join("/");

    return normalizePath(routeKey);
  } catch {
    return null;
  }
}
