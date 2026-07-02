import { Browser } from "@capacitor/browser";
import { supabase } from "./supabase";

// Console do gestor é a PWA (server actions + RLS) — o nativo não reimplementa
// a gestão, só abre essa versão web numa WebView in-app (sem sair do app).
const WEB_BASE = "https://check-ai-br.vercel.app";

// Abre o console do gestor autenticado, sem pedir senha de novo: troca a
// sessão do app por um magic link (curta duração, gerado pelo servidor) e abre
// numa WebView in-app (não sai para o navegador do sistema).
export async function abrirConsoleAdmin(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: "Sessão expirada. Faça login de novo." };

    const res = await fetch(`${WEB_BASE}/api/app-admin-link`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !body.url) {
      return { ok: false, error: body.error ?? "Não foi possível abrir o console." };
    }

    await Browser.open({ url: body.url, presentationStyle: "popover" });
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha de conexão ao abrir o console." };
  }
}
