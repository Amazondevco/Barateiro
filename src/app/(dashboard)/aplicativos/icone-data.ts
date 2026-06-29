import type { createClient } from "@/lib/supabase/server";
import type { Opt, RosterPessoa } from "./icone-types";

type SB = Awaited<ReturnType<typeof createClient>>;

// Opções (cargos/unidades/departamentos) + roster da rede para o editor de ícone.
export async function carregarOpcoes(supabase: SB, redeId: string): Promise<{
  cargos: Opt[];
  unidades: Opt[];
  departamentos: Opt[];
  roster: RosterPessoa[];
}> {
  const [{ data: cargos }, { data: unidades }, { data: deptos }, { data: roster }] =
    await Promise.all([
      supabase.from("cargos").select("id,nome").eq("rede_id", redeId).order("nome"),
      supabase.from("unidades").select("id,nome").eq("rede_id", redeId).eq("status", "ativo").order("nome"),
      supabase.from("departamentos").select("id,nome").eq("rede_id", redeId).eq("status", "ativo").order("nome"),
      supabase
        .from("rede_roster")
        .select("id, nome, status, cargo_id, unidade_id, departamento_id")
        .eq("rede_id", redeId)
        .order("nome"),
    ]);

  return {
    cargos: cargos ?? [],
    unidades: unidades ?? [],
    departamentos: deptos ?? [],
    roster: (roster ?? []) as RosterPessoa[],
  };
}
