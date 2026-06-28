"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function createDepartamento(
  redeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome do departamento." };

  const escopo = String(formData.get("escopo") ?? "unidade");
  const unidadeId = String(formData.get("unidade_id") ?? "").trim() || null;

  if (escopo === "unidade" && !unidadeId)
    return { error: "Selecione a unidade do departamento." };

  const payload = {
    rede_id: redeId,
    nome,
    escopo,
    unidade_id: escopo === "rede" ? null : unidadeId,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("departamentos").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function setDepartamentoStatus(
  id: string,
  status: "ativo" | "inativo",
) {
  const supabase = await createClient();
  await supabase.from("departamentos").update({ status }).eq("id", id);
  revalidatePath("/configuracoes");
}
