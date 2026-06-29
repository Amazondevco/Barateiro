import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FillForm, type FormData } from "./fill-form";

export const metadata = { title: "Formulário — Check.AI" };

export default async function FillPage({
  params,
}: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id, formId } = await params;
  const supabase = await createClient();

  // assinatura adotada pelo membro nesta rede (para o 1-toque)
  const { data: membro } = await supabase
    .from("rede_membros")
    .select("assinatura_svg")
    .eq("id", id)
    .single();

  const { data: form } = await supabase
    .from("formularios")
    .select(
      "id, nome, descricao, formulario_secoes(id, titulo, ordem, permite_na, quebra_pagina, formulario_itens(id, texto, ordem, tipo, opcoes, ajuda, obriga_obs_quando_nao, obriga_foto_quando_nao))",
    )
    .eq("id", formId)
    .single();
  if (!form) notFound();

  // ordena seções e itens
  const f = form as unknown as FormData;
  f.formulario_secoes.sort((a, b) => a.ordem - b.ordem);
  f.formulario_secoes.forEach((s) => s.formulario_itens.sort((a, b) => a.ordem - b.ordem));

  return (
    <FillForm
      redeMembroId={id}
      form={f}
      assinatura={(membro as { assinatura_svg: string | null } | null)?.assinatura_svg ?? null}
    />
  );
}
