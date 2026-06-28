"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean };

/**
 * Atualiza só a identidade visual (white-label) da rede.
 * O admin da rede não tem UPDATE em `redes` via RLS, então autorizamos no
 * servidor e gravamos com o service role — restrito a logo/banner/cor.
 */
export async function updateAparencia(
  redeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const caller = await getSessionProfile();
  if (!caller) return { error: "Sessão expirada." };

  const autorizado =
    caller.papel === "super_admin" ||
    (caller.papel === "admin_supermercado" && caller.rede_id === redeId);
  if (!autorizado) return { error: "Sem permissão." };

  const payload = {
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    favicon_url: String(formData.get("favicon_url") ?? "").trim() || null,
    banner_url: String(formData.get("banner_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#2563eb"),
    cor_sidebar: String(formData.get("cor_sidebar") ?? "").trim() || null,
  };

  const admin = createAdminClient();
  const { error } = await admin.from("redes").update(payload).eq("id", redeId);

  if (error) return { error: error.message };
  revalidatePath("/", "layout"); // atualiza também o sidebar (logo/cor)
  return { ok: true };
}
