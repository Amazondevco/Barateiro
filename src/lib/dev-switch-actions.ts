"use server";

import { redirect } from "next/navigation";
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

  // Usa admin API para gerar magic link — sem precisar saber a senha da conta alvo
  const admin = createAdminClient();
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !linkData?.properties?.email_otp) return;

  await supabase.auth.signOut();
  await supabase.auth.verifyOtp({
    email,
    token: linkData.properties.email_otp,
    type: "magiclink",
  });

  redirect(target.view === "app" ? "/app" : "/");
}
