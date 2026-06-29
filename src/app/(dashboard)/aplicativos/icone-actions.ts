"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type IconeInput = {
  id?: string;
  nome: string;
  nomeCurto: string;
  cor: string;
  cargos: string[];
  unidades: string[];
  departamentos: string[];
};

export async function salvarIcone(
  input: IconeInput,
): Promise<{ error?: string; id?: string }> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }
  if (!input.nome.trim()) return { error: "Informe o nome do app." };

  const supabase = await createClient();
  const row = {
    rede_id: caller.rede_id,
    nome: input.nome.trim(),
    nome_curto: (input.nomeCurto || input.nome).trim().slice(0, 12),
    cor: input.cor,
    cargos: input.cargos,
    unidades: input.unidades,
    departamentos: input.departamentos,
  };

  if (input.id) {
    const { error } = await supabase
      .from("app_icones")
      .update(row)
      .eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/aplicativos");
    return { id: input.id };
  }

  const { data, error } = await supabase
    .from("app_icones")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/aplicativos");
  return { id: data.id };
}

export async function deleteIcone(id: string) {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado") return;
  const supabase = await createClient();
  await supabase.from("app_icones").delete().eq("id", id);
  revalidatePath("/aplicativos");
}
