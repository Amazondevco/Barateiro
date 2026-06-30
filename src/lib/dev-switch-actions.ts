"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DEV_ACCOUNTS, DEV_EMAILS } from "@/lib/dev-accounts";

export type SwitchResult = { to?: string; error?: string; info?: string };

// Troca a sessão para a conta de teste alvo. RETORNA o resultado (não
// redireciona/throw) para o cliente fazer um recarregamento REAL — assim o
// erro aparece na tela e a navegação ignora o Router Cache do Next.
export async function quickSwitch(email: string): Promise<SwitchResult> {
  const target = DEV_ACCOUNTS.find((a) => a.email === email);
  if (!target) return { error: "Conta alvo desconhecida." };

  const supabase = await createClient();

  // só permite trocar se o usuário ATUAL já pertence ao círculo demo
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const atual = user?.email;
  if (!atual) return { error: "Sem sessão atual (faça login de novo)." };
  if (!DEV_EMAILS.includes(atual)) {
    return { error: `Conta atual (${atual}) não pode trocar de visualização.` };
  }

  // Gera um OTP de magic link pela admin API (sem precisar da senha).
  const admin = createAdminClient();
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const otp = link?.properties?.email_otp;
  if (linkErr || !otp) {
    return { error: `generateLink: ${linkErr?.message ?? "sem email_otp"}` };
  }

  // verifyOtp substitui a sessão do cookie pela conta alvo.
  const { data: verify, error: verifyErr } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "magiclink",
  });
  if (verifyErr || !verify?.session) {
    return { error: `verifyOtp: ${verifyErr?.message ?? "sem sessão"}` };
  }

  // Reforça a gravação do cookie (alguns ambientes não persistem só com o verifyOtp).
  await supabase.auth.setSession({
    access_token: verify.session.access_token,
    refresh_token: verify.session.refresh_token,
  });

  // Diagnóstico: confirma quem é a sessão no SERVIDOR após a troca.
  const {
    data: { user: novo },
  } = await supabase.auth.getUser();

  return {
    to: target.view === "app" ? "/app" : "/",
    info: `sessão no servidor: ${novo?.email ?? "?"}`,
  };
}
