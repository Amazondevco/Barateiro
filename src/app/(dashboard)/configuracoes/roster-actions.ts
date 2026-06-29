"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type RosterState = { error?: string; ok?: boolean };

export async function addRosterPessoa(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const cargo_id = String(formData.get("cargo_id") ?? "").trim() || null;
  const unidade_id = String(formData.get("unidade_id") ?? "").trim() || null;
  const departamento_id =
    String(formData.get("departamento_id") ?? "").trim() || null;

  if (!nome) return { error: "Informe o nome." };
  if (cpf.length !== 11) return { error: "CPF inválido (11 dígitos)." };

  const supabase = await createClient();
  const { error } = await supabase.from("rede_roster").insert({
    rede_id: caller.rede_id,
    cpf,
    nome,
    cargo_id,
    unidade_id,
    departamento_id,
    created_by: caller.id,
  });

  if (error) {
    return {
      error: /duplicate|unique/i.test(error.message)
        ? "Este CPF já está na equipe."
        : error.message,
    };
  }

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function removeRosterPessoa(id: string) {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado") return;
  const supabase = await createClient();
  await supabase.from("rede_roster").delete().eq("id", id);
  revalidatePath("/configuracoes");
}

export type ImportState = {
  ok?: boolean;
  inseridos?: number;
  erros?: string[];
  error?: string;
};

// Importa lista colada/CSV: nome; cpf; cargo; unidade; departamento
// Casa cargo/unidade/departamento por NOME (case-insensitive).
export async function importarRoster(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }
  const texto = String(formData.get("lista") ?? "").trim();
  if (!texto) return { error: "Cole ou envie a lista." };

  const supabase = await createClient();
  const [{ data: cargos }, { data: unidades }, { data: deptos }] =
    await Promise.all([
      supabase.from("cargos").select("id,nome").eq("rede_id", caller.rede_id),
      supabase.from("unidades").select("id,nome").eq("rede_id", caller.rede_id),
      supabase.from("departamentos").select("id,nome").eq("rede_id", caller.rede_id),
    ]);

  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  const cargoMap = new Map((cargos ?? []).map((c) => [norm(c.nome), c.id]));
  const uniMap = new Map((unidades ?? []).map((u) => [norm(u.nome), u.id]));
  const depMap = new Map((deptos ?? []).map((d) => [norm(d.nome), d.id]));

  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: Record<string, unknown>[] = [];
  const erros: string[] = [];

  for (const linha of linhas) {
    const cols = linha.split(/[;,\t]/).map((c) => c.trim());
    const [nome, cpfRaw, cargoNome, uniNome, depNome] = cols;
    if (norm(nome) === "nome" && norm(cpfRaw) === "cpf") continue; // cabeçalho
    const cpf = (cpfRaw ?? "").replace(/\D/g, "");
    if (!nome || cpf.length !== 11) {
      erros.push(`"${linha}" — nome ou CPF inválido`);
      continue;
    }
    rows.push({
      rede_id: caller.rede_id,
      cpf,
      nome,
      cargo_id: cargoMap.get(norm(cargoNome)) ?? null,
      unidade_id: uniMap.get(norm(uniNome)) ?? null,
      departamento_id: depMap.get(norm(depNome)) ?? null,
      created_by: caller.id,
    });
  }

  if (rows.length === 0) return { error: "Nenhuma linha válida.", erros };

  const { error } = await supabase
    .from("rede_roster")
    .upsert(rows, { onConflict: "rede_id,cpf", ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true, inseridos: rows.length, erros };
}
