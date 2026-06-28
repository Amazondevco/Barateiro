"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

function parseRede(formData: FormData) {
  const dias = formData
    .getAll("dias_frequencia")
    .map((d) => parseInt(String(d), 10))
    .filter((n) => !Number.isNaN(n))
    .sort();

  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cnpj: String(formData.get("cnpj") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#2563eb"),
    plano: String(formData.get("plano") ?? "free"),
    contato_nome: String(formData.get("contato_nome") ?? "").trim() || null,
    contato_email: String(formData.get("contato_email") ?? "").trim() || null,
    contato_fone: String(formData.get("contato_fone") ?? "").trim() || null,
    horario_limite: String(formData.get("horario_limite") ?? "10:00"),
    dias_frequencia: dias.length ? dias : [1, 3, 5, 6],
    janela_edicao_min: parseInt(
      String(formData.get("janela_edicao_min") ?? "30"),
      10,
    ),
    retencao_fotos_dias: parseInt(
      String(formData.get("retencao_fotos_dias") ?? "60"),
      10,
    ),
  };
}

export async function createRede(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = parseRede(formData);
  if (!payload.nome) return { error: "Informe o nome da rede." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redes")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateRede(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = parseRede(formData);
  if (!payload.nome) return { error: "Informe o nome da rede." };

  const supabase = await createClient();
  const { error } = await supabase.from("redes").update(payload).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true };
}

export async function setRedeStatus(id: string, status: "ativo" | "inativo") {
  const supabase = await createClient();
  await supabase.from("redes").update({ status }).eq("id", id);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
