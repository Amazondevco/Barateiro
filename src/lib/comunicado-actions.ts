"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export type AlvoTipo = "todos" | "usuario" | "unidade" | "departamento" | "cargo";

export type RedeAlvos = {
  unidades: { id: string; nome: string }[];
  departamentos: { id: string; nome: string }[];
  cargos: { id: string; nome: string }[];
  usuarios: { id: string; nome: string }[];
};

// Resolve quem o autor pode atingir: super admin → qualquer rede;
// admin/gerente → apenas a própria. Retorna a rede efetiva ou null (negado).
async function redeEfetiva(redeId: string | null): Promise<string | null> {
  const { profile } = await getSessionContext();
  if (!profile) return null;
  if (profile.papel === "super_admin") return redeId; // escolhe a rede
  if (
    (profile.papel === "admin_supermercado" || profile.papel === "gerente") &&
    profile.rede_id
  ) {
    return profile.rede_id; // sempre a própria, ignora o que veio do cliente
  }
  return null;
}

// Listas de alvos de uma rede (unidades, departamentos, cargos, usuários do app).
// Service role + guard de papel: super admin lê qualquer rede; admin só a sua.
export async function getRedeAlvos(redeId: string): Promise<RedeAlvos> {
  const rede = await redeEfetiva(redeId);
  if (!rede) return { unidades: [], departamentos: [], cargos: [], usuarios: [] };

  const admin = createAdminClient();
  const [{ data: unidades }, { data: departamentos }, { data: cargos }, { data: membros }] =
    await Promise.all([
      admin.from("unidades").select("id, nome").eq("rede_id", rede).order("nome"),
      admin.from("departamentos").select("id, nome").eq("rede_id", rede).order("nome"),
      admin.from("cargos").select("id, nome").eq("rede_id", rede).order("nome"),
      admin
        .from("rede_membros")
        .select("identidade_id, identidades(nome)")
        .eq("rede_id", rede)
        .eq("status", "ativo"),
    ]);

  const usuarios = ((membros ?? []) as Array<Record<string, unknown>>)
    .map((m) => ({
      id: String(m.identidade_id),
      nome:
        typeof m.identidades === "object" && m.identidades && "nome" in m.identidades
          ? String((m.identidades as { nome: string | null }).nome ?? "Sem nome")
          : "Sem nome",
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    unidades: (unidades ?? []) as RedeAlvos["unidades"],
    departamentos: (departamentos ?? []) as RedeAlvos["departamentos"],
    cargos: (cargos ?? []) as RedeAlvos["cargos"],
    usuarios,
  };
}

export async function enviarComunicado(input: {
  redeId: string | null;
  titulo: string;
  corpo: string;
  alvoTipo: AlvoTipo;
  alvoIds: string[];
}): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) return { error: "Sessão expirada." };

  const rede = await redeEfetiva(input.redeId);
  if (!rede) return { error: "Selecione uma rede válida." };

  const titulo = input.titulo.trim();
  const corpo = input.corpo.trim();
  if (!titulo || !corpo) return { error: "Preencha título e mensagem." };

  if (input.alvoTipo !== "todos" && input.alvoIds.length === 0) {
    return { error: "Escolha pelo menos um destinatário para o alvo selecionado." };
  }

  const alvoIds = input.alvoTipo === "todos" ? [] : input.alvoIds;

  const { error } = await supabase.from("comunicados").insert({
    rede_id: rede,
    autor_id: sub,
    titulo,
    corpo,
    alvo_tipo: input.alvoTipo,
    alvo_ids: alvoIds,
  });
  if (error) return { error: error.message };

  // TODO (Fase 4 — push): ao ter Firebase, resolver os device_tokens do alvo
  // e disparar FCM aqui. Por ora o comunicado já chega via inbox (aba Avisos).

  revalidatePath("/comunicados");
  return { ok: true };
}
