"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type AppRedeState = { error?: string; ok?: boolean };

// Salva ícone do app + banner do app da rede (admin autorizado, service role).
export async function updateAplicativoRede(
  redeId: string,
  _prev: AppRedeState,
  formData: FormData,
): Promise<AppRedeState> {
  const caller = await getSessionProfile();
  if (
    caller?.papel !== "admin_supermercado" ||
    caller.rede_id !== redeId
  ) {
    return { error: "Sem permissão." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("redes")
    .update({
      app_icone_url: String(formData.get("app_icone_url") ?? "").trim() || null,
      app_cor: String(formData.get("app_cor") ?? "").trim() || null,
    })
    .eq("id", redeId);

  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  // Propaga ícone/banner/cor para o app de todos os membros da rede.
  revalidatePath("/app", "layout");
  revalidatePath("/api/manifest");
  return { ok: true };
}
