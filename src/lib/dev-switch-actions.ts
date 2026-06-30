"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DEV_ACCOUNTS, DEV_EMAILS } from "@/lib/dev-accounts";

export async function quickSwitch(email: string) {
  const target = DEV_ACCOUNTS.find((a) => a.email === email);
  if (!target) return;

  const supabase = await createClient();

  // só permite trocar se o usuário ATUAL já pertence ao círculo demo
  const { data: { user } } = await supabase.auth.getUser();
  const atual = user?.email;
  if (!atual || !DEV_EMAILS.includes(atual)) return;

  // Gera um OTP de magic link pela admin API (sem precisar saber a senha) e
  // verifica na hora — isso troca a sessão do cookie para a conta alvo.
  const admin = createAdminClient();
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.email_otp) {
    throw new Error(`Troca falhou (generateLink): ${linkErr?.message ?? "sem email_otp"}`);
  }

  // NÃO chamar signOut antes: o verifyOtp já substitui a sessão e grava os
  // cookies novos. Um signOut no meio pode atrapalhar a gravação.
  const { data: verify, error: verifyErr } = await supabase.auth.verifyOtp({
    email,
    token: link.properties.email_otp,
    type: "magiclink",
  });
  if (verifyErr || !verify?.session) {
    throw new Error(`Troca falhou (verifyOtp): ${verifyErr?.message ?? "sem sessão"}`);
  }

  // A sessão (cookie) já trocou. Sem isto, o Next serviria a página já
  // renderizada (Router Cache) com a conta antiga → "não muda". Invalida tudo
  // sob o layout raiz para forçar a re-renderização com a nova conta.
  revalidatePath("/", "layout");

  redirect(target.view === "app" ? "/app" : "/");
}
