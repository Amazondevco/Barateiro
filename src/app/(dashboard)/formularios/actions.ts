"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

export type ItemDraft = {
  texto: string;
  tipo: ItemTipo;
  obriga_obs: boolean;
  obriga_foto: boolean;
  opcoes?: string[];
  ajuda?: string;
};
export type SecaoDraft = {
  titulo: string;
  permite_na: boolean;
  quebra_pagina?: boolean;
  itens: ItemDraft[];
};
export type FormularioPayload = {
  nome: string;
  descricao: string;
  tipo_unidade: UnidadeTipo;
  status: "ativo" | "inativo";
  unidades: string[]; // vazio = todas as unidades do tipo
  departamentos: string[]; // vazio = todos da unidade
  usuarios: string[]; // vazio = todos do departamento
  secoes: SecaoDraft[];
};

export type SaveResult = { ok?: boolean; id?: string; error?: string };

export async function saveFormulario(
  redeId: string,
  formId: string | null,
  payload: FormularioPayload,
): Promise<SaveResult> {
  if (!payload.nome.trim()) return { error: "Informe o nome do formulário." };
  if (payload.secoes.length === 0)
    return { error: "Adicione ao menos uma seção." };

  const supabase = await createClient();
  let id = formId;

  const meta = {
    nome: payload.nome.trim(),
    descricao: payload.descricao.trim() || null,
    tipo_unidade: payload.tipo_unidade,
    status: payload.status,
  };

  if (!id) {
    const { data, error } = await supabase
      .from("formularios")
      .insert({ rede_id: redeId, ...meta })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  } else {
    const { error } = await supabase
      .from("formularios")
      .update(meta)
      .eq("id", id);
    if (error) return { error: error.message };
    // Substitui a estrutura (apaga seções → cascata nos itens)
    const { error: delErr } = await supabase
      .from("formulario_secoes")
      .delete()
      .eq("formulario_id", id);
    if (delErr)
      return {
        error:
          "Não foi possível editar (talvez já existam respostas vinculadas).",
      };
  }

  // Insere seções e itens
  for (let si = 0; si < payload.secoes.length; si++) {
    const sec = payload.secoes[si];
    const { data: s, error: sErr } = await supabase
      .from("formulario_secoes")
      .insert({
        formulario_id: id,
        titulo: sec.titulo.trim() || `Seção ${si + 1}`,
        ordem: si,
        permite_na: sec.permite_na,
        quebra_pagina: sec.quebra_pagina ?? false,
      })
      .select("id")
      .single();
    if (sErr) return { error: sErr.message };

    const itens = sec.itens.filter((it) => it.texto.trim());
    if (itens.length) {
      const { error: iErr } = await supabase.from("formulario_itens").insert(
        itens.map((it, ii) => ({
          secao_id: s.id,
          texto: it.texto.trim(),
          ordem: ii,
          tipo: it.tipo,
          obriga_obs_quando_nao: it.obriga_obs,
          obriga_foto_quando_nao: it.obriga_foto,
          opcoes:
            it.tipo === "multipla_escolha" && it.opcoes?.length
              ? it.opcoes.filter((o) => o.trim())
              : null,
          ajuda: it.ajuda?.trim() || null,
        })),
      );
      if (iErr) return { error: iErr.message };
    }
  }

  // Atribuição a unidades (vazio = todas do tipo)
  await supabase.from("formulario_unidades").delete().eq("formulario_id", id);
  if (payload.unidades.length) {
    await supabase.from("formulario_unidades").insert(
      payload.unidades.map((unidade_id) => ({ formulario_id: id, unidade_id })),
    );
  }

  // Atribuição a departamentos (vazio = todos da unidade)
  await supabase.from("formulario_departamentos").delete().eq("formulario_id", id);
  if (payload.departamentos.length) {
    await supabase.from("formulario_departamentos").insert(
      payload.departamentos.map((departamento_id) => ({
        formulario_id: id,
        departamento_id,
      })),
    );
  }

  // Atribuição a usuários específicos (vazio = todos do departamento)
  await supabase.from("formulario_usuarios").delete().eq("formulario_id", id);
  if (payload.usuarios.length) {
    await supabase.from("formulario_usuarios").insert(
      payload.usuarios.map((user_id) => ({ formulario_id: id, user_id })),
    );
  }

  revalidatePath("/formularios");
  return { ok: true, id: id! };
}

export async function setFormularioStatus(
  id: string,
  status: "ativo" | "inativo",
) {
  const supabase = await createClient();
  await supabase.from("formularios").update({ status }).eq("id", id);
  revalidatePath("/formularios");
}
