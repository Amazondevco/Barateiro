import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas (não exigem login)
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/recuperar-senha",
  "/offline",
  "/cadastro",
  "/termo",
  "/api/manifest",
  "/api/app-icon",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rode lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Usuário do APP (identidade) — contido em /app e nas rotas públicas;
  // não entra no dashboard (onde seria tratado como super_admin pelo fallback).
  const isApp = user?.user_metadata?.tipo === "app";

  // Sem sessão e rota protegida → manda pro login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    // Exceção: o link de convite/recuperação do Supabase cai na Site URL (raiz)
    // com o token no # da URL. Um REDIRECT perderia o #; então fazemos REWRITE
    // para a tela de cadastro (mesma URL), que lê o token e estabelece a sessão.
    // Sem token, essa tela manda o visitante para o login.
    if (pathname === "/") {
      url.pathname = "/auth/redefinir";
      return NextResponse.rewrite(url);
    }
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logado tentando ver /login → app vai pro /app; dashboard, pra raiz
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = isApp ? "/app" : "/";
    return NextResponse.redirect(url);
  }

  // Usuário do app fora do /app (e de rota pública) → manda pro /app
  if (user && isApp && !isPublic && !pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
