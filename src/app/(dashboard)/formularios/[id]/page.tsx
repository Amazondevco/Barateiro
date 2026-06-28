import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

export default async function EditarFormularioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;
  if (!redeId) notFound();

  const supabase = await createClient();

  const { data: form } = await supabase
    .from("formularios")
    .select("id,nome,descricao,tipo_unidade,status")
    .eq("id", id)
    .single();
  if (!form) notFound();

  const [{ data: secoes }, { data: assigned }, { data: deps }] =
    await Promise.all([
      supabase
        .from("formulario_secoes")
        .select(
          "id,titulo,permite_na,quebra_pagina,ordem,formulario_itens(texto,tipo,ordem,obriga_obs_quando_nao,obriga_foto_quando_nao,opcoes,ajuda)",
        )
        .eq("formulario_id", id)
        .order("ordem"),
      supabase
        .from("formulario_departamentos")
        .select("departamento_id")
        .eq("formulario_id", id),
      supabase
        .from("departamentos")
        .select("id,nome")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
    ]);

  const initial = {
    nome: form.nome,
    descricao: form.descricao ?? "",
    tipo_unidade: form.tipo_unidade as UnidadeTipo,
    status: form.status as "ativo" | "inativo",
    departamentos: (assigned ?? []).map((a) => a.departamento_id),
    secoes: (secoes ?? []).map((s) => ({
      titulo: s.titulo,
      permite_na: s.permite_na,
      quebra_pagina: s.quebra_pagina ?? false,
      itens: (
        (s.formulario_itens as {
          texto: string;
          tipo: ItemTipo;
          ordem: number;
          obriga_obs_quando_nao: boolean;
          obriga_foto_quando_nao: boolean;
          opcoes: string[] | null;
          ajuda: string | null;
        }[]) ?? []
      )
        .sort((a, b) => a.ordem - b.ordem)
        .map((it) => ({
          texto: it.texto,
          tipo: it.tipo,
          obriga_obs: it.obriga_obs_quando_nao,
          obriga_foto: it.obriga_foto_quando_nao,
          opcoes: it.opcoes ?? [],
          ajuda: it.ajuda ?? "",
        })),
    })),
  };

  return (
    <>
      <PageHeader title={form.nome} />
      <FormBuilder
        redeId={redeId}
        formId={id}
        departamentos={deps ?? []}
        initial={initial}
      />
    </>
  );
}
