"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean };

async function ensureSuper() {
  const caller = await getSessionProfile();
  return caller?.papel === "super_admin";
}

/** Aparência da plataforma (logo/tema do Amazon Dev & Co.). Só super admin. */
export async function updateAparenciaPlataforma(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await ensureSuper())) return { error: "Sem permissão." };

  const payload = {
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    favicon_url: String(formData.get("favicon_url") ?? "").trim() || null,
    banner_url: String(formData.get("banner_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#2563eb"),
    cor_sidebar: String(formData.get("cor_sidebar") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plataforma")
    .update(payload)
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/", "layout"); // atualiza sidebar/topbar/favicon
  return { ok: true };
}

/** Padrões herdados por novas redes. Só super admin. */
export async function updatePadroes(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await ensureSuper())) return { error: "Sem permissão." };

  const dias = formData
    .getAll("dias")
    .map((d) => parseInt(String(d), 10))
    .filter((n) => !Number.isNaN(n))
    .sort();

  const payload = {
    default_horario_limite: String(formData.get("horario") ?? "10:00"),
    default_dias: dias.length ? dias : [1, 3, 5, 6],
    default_janela_edicao: parseInt(String(formData.get("janela") ?? "30"), 10),
    default_retencao_fotos: parseInt(
      String(formData.get("retencao") ?? "60"),
      10,
    ),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plataforma")
    .update(payload)
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}
