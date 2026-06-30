"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEV_ACCOUNTS, DEV_EMAILS } from "@/lib/dev-accounts";

/**
 * Troca de visualização (Super Admin / Admin / Celular).
 * ⚠️ Só funciona dentro do "círculo demo" (DEV_ACCOUNTS) — o usuário ATUAL
 * precisa já ser uma dessas contas. Senha compartilhada fixa (trocar antes
 * de uso real do cliente).
 */
const SWITCH_PASSWORD = "Admin@123";

export async function quickSwitch(email: string) {
  const target = DEV_ACCOUNTS.find((a) => a.email === email);
  if (!target) return;

  const supabase = await createClient();

  // só permite trocar se o usuário ATUAL já pertence ao círculo demo
  const { data: { user } } = await supabase.auth.getUser();
  const atual = user?.email;
  if (!atual || !DEV_EMAILS.includes(atual)) return;

  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email, password: SWITCH_PASSWORD });

  redirect(target.view === "app" ? "/app" : "/");
}
