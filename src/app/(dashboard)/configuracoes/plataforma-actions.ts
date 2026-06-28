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

async function savePlataforma(patch: Record<string, unknown>): Promise<FormState> {
  if (!(await ensureSuper())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("plataforma")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}

/** Departamentos padrão (um por linha) que toda rede nova já vem criada. */
export async function updateDepartamentosPadrao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const lista = String(formData.get("departamentos") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return savePlataforma({ default_departamentos: lista });
}

/** Tipos de unidade habilitados por padrão para novas redes. */
export async function updateUnidadesPadrao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tipos = formData.getAll("tipos").map((t) => String(t));
  return savePlataforma({
    default_unidade_tipos: tipos.length ? tipos : ["loja"],
  });
}

/** Padrões de novos usuários (papel, status e limite por rede). */
export async function updateUsuariosPadrao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limiteRaw = String(formData.get("limite") ?? "").trim();
  const limite = limiteRaw ? parseInt(limiteRaw, 10) : null;
  return savePlataforma({
    default_papel_usuario: String(formData.get("papel") ?? "gerente"),
    default_status_usuario: String(formData.get("status") ?? "ativo"),
    default_limite_usuarios:
      limite && !Number.isNaN(limite) && limite > 0 ? limite : null,
  });
}

/** Permissões padrão dos cargos de sistema (Admin, Gerente, Colaborador). */
export async function updatePermissoesPadrao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const get = (k: string) => formData.getAll(k).map((v) => String(v));
  return savePlataforma({
    default_perms_admin: get("admin"),
    default_perms_gerente: get("gerente"),
    default_perms_colaborador: get("colaborador"),
  });
}

/** Padrões do aplicativo dos gerentes. */
export async function updateAplicativoPadrao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return savePlataforma({
    app_foto_obrigatoria: formData.get("foto") === "on",
    app_geolocalizacao: formData.get("geo") === "on",
    app_assinatura: formData.get("assinatura") === "on",
    app_offline: formData.get("offline") === "on",
  });
}
