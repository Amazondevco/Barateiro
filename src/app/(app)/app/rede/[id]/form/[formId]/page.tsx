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

  // assinatura adotada + geo da unidade do membro (para o geofence)
  const { data: membro } = await supabase
    .from("rede_membros")
    .select("assinatura_svg, unidades(geo_lat, geo_lng)")
    .eq("id", id)
    .single();

  const { data: form } = await supabase
    .from("formularios")
    .select(
      "id, nome, descricao, exige_localizacao, geofence_raio_m, formulario_secoes(id, titulo, ordem, permite_na, quebra_pagina, formulario_itens(id, texto, ordem, tipo, opcoes, ajuda, obriga_obs_quando_nao, obriga_foto_quando_nao))",
    )
    .eq("id", formId)
    .single();
  if (!form) notFound();

  // ordena seções e itens
  const f = form as unknown as FormData;
  f.formulario_secoes.sort((a, b) => a.ordem - b.ordem);
  f.formulario_secoes.forEach((s) => s.formulario_itens.sort((a, b) => a.ordem - b.ordem));

  const fm = form as unknown as {
    exige_localizacao?: boolean;
    geofence_raio_m?: number | null;
  };
  const uni = (
    membro as { unidades?: { geo_lat: number | null; geo_lng: number | null } | null } | null
  )?.unidades;
  const raio = fm.geofence_raio_m ?? null;

  return (
    <FillForm
      redeMembroId={id}
      form={f}
      assinatura={(membro as { assinatura_svg: string | null } | null)?.assinatura_svg ?? null}
      exigeLocalizacao={fm.exige_localizacao ?? false}
      geofence={
        raio
          ? { raio, uniLat: uni?.geo_lat ?? null, uniLng: uni?.geo_lng ?? null }
          : null
      }
    />
  );
}
