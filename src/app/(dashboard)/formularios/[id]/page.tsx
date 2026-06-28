import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";
import { RespostasView, type RespostaRow } from "./respostas-view";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

const TABS = [
  { key: "modelo", label: "Modelo" },
  { key: "respostas", label: "Respostas" },
];

type Periodo = "dia" | "semana" | "mes";

export default async function FormularioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; periodo?: string; ref?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "modelo";
  const periodo: Periodo =
    sp.periodo === "semana" || sp.periodo === "mes" ? sp.periodo : "dia";
  const ref = sp.ref;
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
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
        <RespostasTab
          supabase={supabase}
          redeId={redeId}
          formId={id}
          periodo={periodo}
          refIso={ref}
        />
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

/* ---------- helpers de período (Dia / Semana / Mês) ---------- */

const fmtISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function parseRef(ref?: string): Date {
  if (ref && /^\d{4}-\d{2}-\d{2}$/.test(ref)) {
    const [y, m, d] = ref.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function rangeFor(periodo: Periodo, ref: Date): { start: Date; end: Date } {
  if (periodo === "dia") return { start: ref, end: ref };
  if (periodo === "semana") {
    const dow = (ref.getDay() + 6) % 7; // segunda = 0
    const start = new Date(ref);
    start.setDate(ref.getDate() - dow);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }
  return {
    start: new Date(ref.getFullYear(), ref.getMonth(), 1),
    end: new Date(ref.getFullYear(), ref.getMonth() + 1, 0),
  };
}

function shiftRef(periodo: Periodo, ref: Date, dir: 1 | -1): Date {
  const d = new Date(ref);
  if (periodo === "dia") d.setDate(d.getDate() + dir);
  else if (periodo === "semana") d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

function labelFor(periodo: Periodo, start: Date, end: Date): string {
  if (periodo === "dia")
    return start.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  if (periodo === "mes")
    return start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const opt: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${start.toLocaleDateString("pt-BR", opt)} – ${end.toLocaleDateString(
    "pt-BR",
    opt,
  )}`;
}

type RespRaw = {
  id: string;
  data_referencia: string;
  status: string;
  total_nao: number;
  total_itens: number;
  unidade_id: string;
  usuario_id: string;
  unidades: unknown;
  profiles: unknown;
};

async function RespostasTab({
  supabase,
  redeId,
  formId,
  periodo,
  refIso,
}: {
  supabase: SB;
  redeId: string;
  formId: string;
  periodo: Periodo;
  refIso?: string;
}) {
  const refDate = parseRef(refIso);
  const { start, end } = rangeFor(periodo, refDate);
  const startISO = fmtISO(start);
  const endISO = fmtISO(end);

  const [{ data }, { data: unidadesData }, { data: deps }, { data: usuarios }] =
    await Promise.all([
      supabase
        .from("respostas")
        .select(
          "id,data_referencia,status,total_nao,total_itens,unidade_id,usuario_id,unidades(nome),profiles(nome,departamento_id)",
        )
        .eq("formulario_id", formId)
        .gte("data_referencia", startISO)
        .lte("data_referencia", endISO)
        .order("data_referencia", { ascending: false })
        .order("enviado_em", { ascending: false })
        .limit(500),
      supabase
        .from("unidades")
        .select("id,nome")
        .eq("rede_id", redeId)
        .order("nome"),
      supabase
        .from("departamentos")
        .select("id,nome,unidade_id")
        .eq("rede_id", redeId)
        .order("nome"),
      supabase
        .from("profiles")
        .select("id,nome,departamento_id")
        .eq("rede_id", redeId)
        .order("nome"),
    ]);

  const rows: RespostaRow[] = ((data ?? []) as RespRaw[]).map((r) => {
    const uni = r.unidades as { nome: string } | null;
    const ger = r.profiles as {
      nome: string;
      departamento_id: string | null;
    } | null;
    return {
      id: r.id,
      data_referencia: r.data_referencia,
      status: r.status,
      total_nao: r.total_nao ?? 0,
      total_itens: r.total_itens ?? 0,
      unidade_id: r.unidade_id,
      unidade_nome: uni?.nome ?? "",
      usuario_id: r.usuario_id,
      usuario_nome: ger?.nome ?? "",
      departamento_id: ger?.departamento_id ?? null,
    };
  });

  return (
    <RespostasView
      rows={rows}
      unidades={unidadesData ?? []}
      departamentos={deps ?? []}
      usuarios={usuarios ?? []}
      agruparPorDia={periodo !== "dia"}
      periodo={periodo}
      refIso={fmtISO(refDate)}
      prevRef={fmtISO(shiftRef(periodo, refDate, -1))}
      nextRef={fmtISO(shiftRef(periodo, refDate, 1))}
      periodLabel={labelFor(periodo, start, end)}
    />
  );
}
