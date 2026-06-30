import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, ClipboardCheck, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PillTabs } from "@/components/ui/pill-tabs";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";
import { RespostasView, type RespostaRow } from "./respostas-view";
import { RelatoriosView } from "./relatorios-view";
import { carregarBase, computar, type Kind } from "@/lib/relatorios";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

const TABS = [
  { key: "modelo", label: "Modelo", icon: Layers },
  { key: "respostas", label: "Respostas", icon: ClipboardCheck },
  { key: "painel", label: "Painel", icon: BarChart3 },
];

type Periodo = "dia" | "semana" | "mes";

export default async function FormularioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; periodo?: string; ref?: string; rp?: string }>;
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
    .select(
      "id,nome,descricao,tipo_unidade,status,disponivel_de,disponivel_ate,dias_semana,exige_localizacao,geofence_raio_m",
    )
    .eq("id", id)
    .single();
  if (!form) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/formularios"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Checklists
      </Link>
      <PageHeader title={form.nome} crumb={form.nome} />

      <PillTabs
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          icon: t.icon,
          href: `/formularios/${id}?tab=${t.key}`,
          active: tab === t.key,
        }))}
      />

      {tab === "respostas" ? (
        <RespostasTab
          supabase={supabase}
          redeId={redeId}
          formId={id}
          periodo={periodo}
          refIso={ref}
        />
      ) : tab === "painel" ? (
        <PainelTab supabase={supabase} redeId={redeId} formId={id} rp={sp.rp ?? "tudo"} />
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
  disponivel_de: string | null;
  disponivel_ate: string | null;
  dias_semana: number[] | null;
};

const RP_OPCOES = [
  { v: "tudo", label: "Tudo", dias: 0 },
  { v: "30", label: "30 dias", dias: 30 },
  { v: "7", label: "7 dias", dias: 7 },
];

async function PainelTab({
  supabase,
  redeId,
  formId,
  rp,
}: {
  supabase: SB;
  redeId: string;
  formId: string;
  rp: string;
}) {
  const opc = RP_OPCOES.find((o) => o.v === rp) ?? RP_OPCOES[0];
  let desdeIso: string | undefined;
  if (opc.dias > 0) {
    const d = new Date();
    d.setDate(d.getDate() - opc.dias);
    desdeIso = d.toISOString().slice(0, 10);
  }

  const [{ data: rels }, base] = await Promise.all([
    supabase
      .from("relatorios")
      .select("id, titulo, kind, spec, origem, ordem")
      .eq("formulario_id", formId)
      .order("ordem"),
    carregarBase(supabase, formId, redeId, desdeIso),
  ]);
  const relatorios = (
    (rels ?? []) as {
      id: string;
      titulo: string;
      kind: Kind;
      spec: { topN?: number } | null;
      origem: string;
    }[]
  ).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    kind: r.kind,
    origem: r.origem,
    data: computar(r.kind, r.spec ?? {}, base),
  }));
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {RP_OPCOES.map((o) => (
          <Link
            key={o.v}
            href={`/formularios/${formId}?tab=painel&rp=${o.v}`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              opc.v === o.v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>
      <RelatoriosView formId={formId} relatorios={relatorios} />
    </div>
  );
}

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
    disponivel_de: form.disponivel_de
      ? form.disponivel_de.slice(0, 5)
      : null,
    disponivel_ate: form.disponivel_ate
      ? form.disponivel_ate.slice(0, 5)
      : null,
    dias_semana: form.dias_semana ?? [],
    exige_localizacao:
      (form as { exige_localizacao?: boolean }).exige_localizacao ?? false,
    geofence_raio_m:
      (form as { geofence_raio_m?: number | null }).geofence_raio_m ?? null,
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
  enviado_em: string;
  unidade_id: string;
  usuario_id: string;
  lida_em: string | null;
  unidades: unknown;
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
          "id,data_referencia,status,total_nao,total_itens,enviado_em,unidade_id,usuario_id,lida_em,unidades(nome)",
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

  // Nome/departamento de quem respondeu — pode ser usuário do dashboard (profiles)
  // OU membro do app (identidades + rede_membros). A FK virou auth.users (0024).
  const respList = (data ?? []) as RespRaw[];
  const userIds = [...new Set(respList.map((r) => r.usuario_id))];
  const nomeMap = new Map<string, { nome: string; departamento_id: string | null }>();
  if (userIds.length) {
    const [{ data: profs }, { data: idents }, { data: vinc }] = await Promise.all([
      supabase.from("profiles").select("id,nome,departamento_id").in("id", userIds),
      supabase.from("identidades").select("id,nome").in("id", userIds),
      supabase
        .from("rede_membros")
        .select("identidade_id,departamento_id")
        .eq("rede_id", redeId)
        .in("identidade_id", userIds),
    ]);
    const deptoApp = new Map(
      (vinc ?? []).map((v) => [v.identidade_id, v.departamento_id as string | null]),
    );
    for (const p of profs ?? [])
      nomeMap.set(p.id, { nome: p.nome, departamento_id: p.departamento_id });
    for (const i of idents ?? [])
      if (!nomeMap.has(i.id))
        nomeMap.set(i.id, { nome: i.nome, departamento_id: deptoApp.get(i.id) ?? null });
  }

  const rows: RespostaRow[] = respList.map((r) => {
    const uni = r.unidades as { nome: string } | null;
    const ger = nomeMap.get(r.usuario_id) ?? null;
    return {
      id: r.id,
      data_referencia: r.data_referencia,
      status: r.status,
      total_nao: r.total_nao ?? 0,
      total_itens: r.total_itens ?? 0,
      enviado_em: r.enviado_em,
      unidade_id: r.unidade_id,
      unidade_nome: uni?.nome ?? "",
      usuario_id: r.usuario_id,
      usuario_nome: ger?.nome ?? "",
      departamento_id: ger?.departamento_id ?? null,
      lida: r.lida_em != null,
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
