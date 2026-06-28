"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

/** Atualiza só a identidade visual (white-label) da rede. */
export async function updateAparencia(
  redeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#2563eb"),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("redes")
    .update(payload)
    .eq("id", redeId);

  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}
