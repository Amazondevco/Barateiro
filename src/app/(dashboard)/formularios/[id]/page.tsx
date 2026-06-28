import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

const TABS = [
  { key: "modelo", label: "Modelo" },
  { key: "respostas", label: "Respostas" },
];

export default async function FormularioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "modelo";
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

  return (
    <div className="space-y-4">
      <Link
        href="/formularios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Formulários
      </Link>
      <PageHeader title={form.nome} crumb={form.nome} />

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/formularios/${id}?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "respostas" ? (
        <RespostasTab supabase={supabase} formId={id} />
      ) : (
        <ModeloTab supabase={supabase} redeId={redeId} form={form} />
      )}
    </div>
  );
}

type SB = Awaited<ReturnType<typeof createClient>>;
type Form = {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_unidade: string;
  status: string;
};

async function ModeloTab({
  supabase,
  redeId,
  form,
}: {
  supabase: SB;
  redeId: string;
  form: Form;
}) {
  const [
    { data: secoes },
    { data: assignedUnits },
    { data: assigned },
    { data: assignedUsers },
    { data: unidadesData },
    { data: deps },
    { data: usuarios },
  ] = await Promise.all([
    supabase
      .from("formulario_secoes")
      .select(
        "id,titulo,permite_na,quebra_pagina,ordem,formulario_itens(texto,tipo,ordem,obriga_obs_quando_nao,obriga_foto_quando_nao,opcoes,ajuda)",
      )
      .eq("formulario_id", form.id)
      .order("ordem"),
    supabase
      .from("formulario_unidades")
      .select("unidade_id")
      .eq("formulario_id", form.id),
    supabase
      .from("formulario_departamentos")
      .select("departamento_id")
      .eq("formulario_id", form.id),
    supabase
      .from("formulario_usuarios")
      .select("user_id")
      .eq("formulario_id", form.id),
    supabase
      .from("unidades")
      .select("id,nome")
      .eq("rede_id", redeId)
      .eq("status", "ativo")
      .order("nome"),
    supabase
      .from("departamentos")
      .select("id,nome,unidade_id")
      .eq("rede_id", redeId)
      .eq("status", "ativo")
      .order("nome"),
    supabase
      .from("profiles")
      .select("id,nome,departamento_id")
      .eq("rede_id", redeId)
      .eq("status", "ativo")
      .order("nome"),
  ]);

  const initial = {
    nome: form.nome,
    descricao: form.descricao ?? "",
    tipo_unidade: form.tipo_unidade as UnidadeTipo,
    status: form.status as "ativo" | "inativo",
    unidades: (assignedUnits ?? []).map((a) => a.unidade_id),
    departamentos: (assigned ?? []).map((a) => a.departamento_id),
    usuarios: (assignedUsers ?? []).map((a) => a.user_id),
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
    <FormBuilder
      redeId={redeId}
      formId={form.id}
      unidades={unidadesData ?? []}
      departamentos={deps ?? []}
      usuarios={usuarios ?? []}
      initial={initial}
      hideBack
    />
  );
}

async function RespostasTab({
  supabase,
  formId,
}: {
  supabase: SB;
  formId: string;
}) {
  const { data: respostas } = await supabase
    .from("respostas")
    .select(
      "id,data_referencia,status,total_nao,enviado_em,unidades(nome),profiles(nome)",
    )
    .eq("formulario_id", formId)
    .order("enviado_em", { ascending: false })
    .limit(100);

  if ((respostas ?? []).length === 0) {
    return (
      <EmptyState
        title="Nenhuma resposta ainda"
        description="Quando os gerentes enviarem este checklist, as respostas aparecerão aqui."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Data</TH>
          <TH>Unidade</TH>
          <TH>Gerente</TH>
          <TH>Não-conformidades</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <tbody>
        {(respostas ?? []).map((r) => {
          const uni = r.unidades as unknown as { nome: string } | null;
          const ger = r.profiles as unknown as { nome: string } | null;
          return (
            <TR key={r.id}>
              <TD>{new Date(r.data_referencia).toLocaleDateString("pt-BR")}</TD>
              <TD>{uni?.nome ?? "—"}</TD>
              <TD>{ger?.nome ?? "—"}</TD>
              <TD>
                {r.total_nao > 0 ? (
                  <Badge tone="danger">{r.total_nao}</Badge>
                ) : (
                  <Badge tone="success">0</Badge>
                )}
              </TD>
              <TD>
                <Badge tone={r.status === "no_prazo" ? "success" : "warning"}>
                  {r.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
                </Badge>
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
