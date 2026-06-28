"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function createUnidade(
  redeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome da unidade." };

  const lat = String(formData.get("geo_lat") ?? "").trim();
  const lng = String(formData.get("geo_lng") ?? "").trim();

  const payload = {
    rede_id: redeId,
    nome,
    codigo: String(formData.get("codigo") ?? "").trim() || null,
    tipo: String(formData.get("tipo") ?? "loja"),
    endereco: String(formData.get("endereco") ?? "").trim() || null,
    cidade: String(formData.get("cidade") ?? "").trim() || null,
    uf: String(formData.get("uf") ?? "").trim().toUpperCase() || null,
    geo_lat: lat ? parseFloat(lat) : null,
    geo_lng: lng ? parseFloat(lng) : null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("unidades").insert(payload);
  if (error) return { error: error.message };

  revalidatePath(`/clientes/${redeId}`);
  return { ok: true };
}

export async function updateUnidade(
  id: string,
  redeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome da unidade." };

  const lat = String(formData.get("geo_lat") ?? "").trim();
  const lng = String(formData.get("geo_lng") ?? "").trim();

  const payload = {
    nome,
    codigo: String(formData.get("codigo") ?? "").trim() || null,
    tipo: String(formData.get("tipo") ?? "loja"),
    endereco: String(formData.get("endereco") ?? "").trim() || null,
    cidade: String(formData.get("cidade") ?? "").trim() || null,
    uf: String(formData.get("uf") ?? "").trim().toUpperCase() || null,
    geo_lat: lat ? parseFloat(lat) : null,
    geo_lng: lng ? parseFloat(lng) : null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("unidades").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/clientes/${redeId}`);
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function setUnidadeStatus(
  id: string,
  redeId: string,
  status: "ativo" | "inativo",
) {
  const supabase = await createClient();
  await supabase.from("unidades").update({ status }).eq("id", id);
  revalidatePath(`/clientes/${redeId}`);
  revalidatePath("/configuracoes");
}
