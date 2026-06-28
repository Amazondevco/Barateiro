"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * ⚠️ Ferramenta de DESENVOLVIMENTO apenas.
 * Troca rápida entre contas de teste. Desativada em produção (NODE_ENV).
 * Antes de ir a produção: remover este arquivo e o componente UserSwitcher.
 */
export const DEV_ACCOUNTS = [
  { email: "amazondevco@gmail.com", label: "Amazon Dev & Co.", role: "Super Admin" },
  { email: "admin@admin.com", label: "Admin", role: "Super Admin" },
  { email: "admin@barateiro.com", label: "Dono Barateiro", role: "Admin da rede" },
] as const;

const DEV_PASSWORD = "Admin@123";

export async function quickSwitch(email: string) {
  if (process.env.NODE_ENV === "production") return;
  if (!DEV_ACCOUNTS.some((a) => a.email === email)) return;

  const supabase = await createClient();
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({ email, password: DEV_PASSWORD });
  redirect("/");
}
