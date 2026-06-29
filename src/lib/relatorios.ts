import type { createClient } from "@/lib/supabase/server";

// Tipos de relatório suportados pelo renderizador. A IA escolhe entre estes
// (saída confiável) e o app calcula com as respostas reais.
export const KINDS = [
  "conformidade",
  "nao_por_pergunta",
  "evolucao",
  "por_unidade",
  "volume",
  "distribuicao",
  "media_numerica",
] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABEL: Record<Kind, string> = {
  conformidade: "Conformidade geral",
  nao_por_pergunta: "Não-conformidades por pergunta",
  evolucao: "Evolução da conformidade",
  por_unidade: "Conformidade por unidade",
  volume: "Volume de envios",
  distribuicao: "Distribuição das respostas de uma pergunta",
  media_numerica: "Média de um campo numérico",
};

// Tipos que precisam de uma pergunta-alvo (spec.itemId).
export const KINDS_COM_ITEM: Kind[] = ["distribuicao", "media_numerica"];

export type Spec = { topN?: number; itemId?: string };

export type RelatorioRow = {
  id: string;
  titulo: string;
  kind: Kind;
  spec: Spec;
  ordem: number;
  origem: string;
};

export type Computed =
  | { kind: "conformidade"; conforme: number; nao: number; total: number; pct: number }
  | { kind: "volume"; total: number }
  | { kind: "nao_por_pergunta"; bars: { label: string; value: number }[] }
  | { kind: "evolucao"; points: { label: string; pct: number }[] }
  | { kind: "por_unidade"; bars: { label: string; pct: number; n: number }[] }
  | { kind: "distribuicao"; titulo: string; bars: { label: string; value: number }[] }
  | { kind: "media_numerica"; media: number; n: number; titulo: string }
  | { kind: "vazio" };

type SB = Awaited<ReturnType<typeof createClient>>;
const NAO = new Set(["nao", "não", "ruptura"]);

export type BaseDados = {
  respostas: {
    id: string;
    unidade_id: string | null;
    data_referencia: string | null;
    total_itens: number | null;
    total_nao: number | null;
  }[];
  itensTexto: Map<string, string>;
  valoresPorItem: Map<string, string[]>;
  unidades: Map<string, string>;
};

// Carrega tudo que os relatórios precisam (escopo via RLS da sessão).
// `desdeIso` (YYYY-MM-DD) filtra por período; undefined = tudo.
export async function carregarBase(
  supabase: SB,
  formId: string,
  redeId: string,
  desdeIso?: string,
): Promise<BaseDados> {
  let q = supabase
    .from("respostas")
    .select("id, unidade_id, data_referencia, total_itens, total_nao")
    .eq("formulario_id", formId);
  if (desdeIso) q = q.gte("data_referencia", desdeIso);

  const [{ data: resp }, { data: itens }, { data: unis }] = await Promise.all([
    q.order("data_referencia", { ascending: false }).limit(1000),
    supabase
      .from("formulario_secoes")
      .select("formulario_itens(id, texto)")
      .eq("formulario_id", formId),
    supabase.from("unidades").select("id, nome").eq("rede_id", redeId),
  ]);

  const respostas = (resp ?? []) as BaseDados["respostas"];

  const itensTexto = new Map<string, string>();
  for (const s of (itens ?? []) as { formulario_itens: { id: string; texto: string }[] }[]) {
    for (const it of s.formulario_itens ?? []) itensTexto.set(it.id, it.texto);
  }

  const unidades = new Map<string, string>();
  for (const u of (unis ?? []) as { id: string; nome: string }[]) unidades.set(u.id, u.nome);

  // valores por item (das respostas filtradas)
  const valoresPorItem = new Map<string, string[]>();
  const ids = respostas.map((r) => r.id);
  if (ids.length) {
    const { data: ri } = await supabase
      .from("resposta_itens")
      .select("item_id, valor")
      .in("resposta_id", ids.slice(0, 1000));
    for (const row of (ri ?? []) as { item_id: string; valor: string | null }[]) {
      const arr = valoresPorItem.get(row.item_id) ?? [];
      arr.push(row.valor ?? "");
      valoresPorItem.set(row.item_id, arr);
    }
  }

  return { respostas, itensTexto, valoresPorItem, unidades };
}

export function computar(kind: Kind, spec: Spec, b: BaseDados): Computed {
  if (!b.respostas.length) return { kind: "vazio" };
  const topN = spec.topN ?? 8;

  if (kind === "volume") return { kind: "volume", total: b.respostas.length };

  if (kind === "conformidade") {
    let total = 0,
      nao = 0;
    for (const r of b.respostas) {
      total += r.total_itens ?? 0;
      nao += r.total_nao ?? 0;
    }
    const conforme = Math.max(0, total - nao);
    return {
      kind: "conformidade",
      conforme,
      nao,
      total,
      pct: total ? Math.round((conforme / total) * 100) : 0,
    };
  }

  if (kind === "nao_por_pergunta") {
    const bars = [...b.valoresPorItem.entries()]
      .map(([id, vals]) => ({
        label: b.itensTexto.get(id) ?? "—",
        value: vals.filter((v) => NAO.has(v.toLowerCase())).length,
      }))
      .filter((x) => x.value > 0)
      .sort((a, b2) => b2.value - a.value)
      .slice(0, topN);
    return { kind: "nao_por_pergunta", bars };
  }

  if (kind === "distribuicao") {
    const id = spec.itemId ?? "";
    const vals = (b.valoresPorItem.get(id) ?? []).filter(Boolean);
    const cont = new Map<string, number>();
    for (const v of vals) cont.set(v, (cont.get(v) ?? 0) + 1);
    const bars = [...cont.entries()]
      .map(([label, value]) => ({ label: rotularValor(label), value }))
      .sort((a, b2) => b2.value - a.value)
      .slice(0, topN);
    return { kind: "distribuicao", titulo: b.itensTexto.get(id) ?? "", bars };
  }

  if (kind === "media_numerica") {
    const id = spec.itemId ?? "";
    const nums = (b.valoresPorItem.get(id) ?? [])
      .map((v) => parseFloat((v ?? "").replace(",", ".")))
      .filter((n) => Number.isFinite(n));
    const media = nums.length
      ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100
      : 0;
    return { kind: "media_numerica", media, n: nums.length, titulo: b.itensTexto.get(id) ?? "" };
  }

  if (kind === "por_unidade") {
    const acc = new Map<string, { itens: number; nao: number; n: number }>();
    for (const r of b.respostas) {
      const k = r.unidade_id ?? "—";
      const cur = acc.get(k) ?? { itens: 0, nao: 0, n: 0 };
      cur.itens += r.total_itens ?? 0;
      cur.nao += r.total_nao ?? 0;
      cur.n += 1;
      acc.set(k, cur);
    }
    const bars = [...acc.entries()]
      .map(([id, v]) => ({
        label: b.unidades.get(id) ?? "Sem unidade",
        pct: v.itens ? Math.round(((v.itens - v.nao) / v.itens) * 100) : 0,
        n: v.n,
      }))
      .sort((a, b2) => b2.pct - a.pct)
      .slice(0, topN);
    return { kind: "por_unidade", bars };
  }

  // evolucao — % conforme por dia (últimos 14 dias com dados)
  const acc = new Map<string, { itens: number; nao: number }>();
  for (const r of b.respostas) {
    const d = r.data_referencia ?? "";
    if (!d) continue;
    const cur = acc.get(d) ?? { itens: 0, nao: 0 };
    cur.itens += r.total_itens ?? 0;
    cur.nao += r.total_nao ?? 0;
    acc.set(d, cur);
  }
  const points = [...acc.entries()]
    .sort((a, b2) => a[0].localeCompare(b2[0]))
    .slice(-14)
    .map(([d, v]) => ({
      label: d.slice(5).split("-").reverse().join("/"),
      pct: v.itens ? Math.round(((v.itens - v.nao) / v.itens) * 100) : 0,
    }));
  return { kind: "evolucao", points };
}

// rótulos amigáveis para valores de conformidade
function rotularValor(v: string): string {
  const m: Record<string, string> = {
    ok: "OK",
    nao: "Não",
    sim: "Sim",
    abastecido: "Abastecido",
    ruptura: "Ruptura",
    na: "N/A",
  };
  return m[v.toLowerCase()] ?? v;
}
