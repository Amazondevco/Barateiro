"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALL_PERMISSOES } from "@/lib/permissoes";

export type CargoState = { error?: string; ok?: boolean };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function sanitize(perms: string[]) {
  return perms.filter((p) => ALL_PERMISSOES.includes(p));
}

export async function createCargo(
  redeId: string,
  nome: string,
  permissoes: string[],
): Promise<CargoState> {
  if (!nome.trim()) return { error: "Informe o nome do cargo." };
  const slug = slugify(nome) || `cargo-${Date.now()}`;
  const supabase = await createClient();
  const { error } = await supabase.from("cargos").insert({
    rede_id: redeId,
    nome: nome.trim(),
    slug,
    sistema: false,
    permissoes: sanitize(permissoes),
  });
  if (error)
    return {
      error: error.message.includes("duplicate")
        ? "Já existe um cargo com esse nome."
        : error.message,
    };
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function updateCargo(
  id: string,
  nome: string,
  permissoes: string[],
): Promise<CargoState> {
  const supabase = await createClient();
  const { data: cargo } = await supabase
    .from("cargos")
    .select("sistema")
    .eq("id", id)
    .single();
  if (cargo?.sistema)
    return { error: "Cargos fixos não podem ser alterados." };

  const { error } = await supabase
    .from("cargos")
    .update({ nome: nome.trim(), permissoes: sanitize(permissoes) })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function deleteCargo(id: string): Promise<CargoState> {
  const supabase = await createClient();
  const { data: cargo } = await supabase
    .from("cargos")
    .select("sistema")
    .eq("id", id)
    .single();
  if (cargo?.sistema)
    return { error: "Cargos fixos não podem ser excluídos." };

  const { error } = await supabase.from("cargos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}
