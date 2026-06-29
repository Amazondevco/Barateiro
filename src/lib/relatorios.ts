import type { createClient } from "@/lib/supabase/server";

// Tipos de relatório suportados pelo renderizador. A IA escolhe entre estes
// (saída confiável) e o app calcula com as respostas reais.
export const KINDS = [
  "conformidade",
  "nao_por_pergunta",
  "evolucao",
  "por_unidade",
  "volume",
] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABEL: Record<Kind, string> = {
  conformidade: "Conformidade geral",
  nao_por_pergunta: "Não-conformidades por pergunta",
  evolucao: "Evolução da conformidade",
  por_unidade: "Conformidade por unidade",
  volume: "Volume de envios",
};

export type RelatorioRow = {
  id: string;
  titulo: string;
  kind: Kind;
  spec: { topN?: number };
  ordem: number;
  origem: string;
};

export type Computed =
  | { kind: "conformidade"; conforme: number; nao: number; total: number; pct: number }
  | { kind: "volume"; total: number }
  | { kind: "nao_por_pergunta"; bars: { label: string; value: number }[] }
  | { kind: "evolucao"; points: { label: string; pct: number }[] }
  | { kind: "por_unidade"; bars: { label: string; pct: number; n: number }[] }
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
  naoPorItem: Map<string, number>;
  unidades: Map<string, string>;
};

// Carrega tudo que os relatórios precisam (escopo via RLS da sessão).
export async function carregarBase(
  supabase: SB,
  formId: string,
  redeId: string,
): Promise<BaseDados> {
  const [{ data: resp }, { data: itens }, { data: unis }] = await Promise.all([
    supabase
      .from("respostas")
      .select("id, unidade_id, data_referencia, total_itens, total_nao")
      .eq("formulario_id", formId)
      .order("data_referencia", { ascending: false })
      .limit(1000),
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

  // não-conformidades por item (só busca itens das respostas deste form)
  const naoPorItem = new Map<string, number>();
  const ids = respostas.map((r) => r.id);
  if (ids.length) {
    const { data: ri } = await supabase
      .from("resposta_itens")
      .select("item_id, valor")
      .in("resposta_id", ids.slice(0, 1000));
    for (const row of (ri ?? []) as { item_id: string; valor: string | null }[]) {
      if (NAO.has((row.valor ?? "").toLowerCase())) {
        naoPorItem.set(row.item_id, (naoPorItem.get(row.item_id) ?? 0) + 1);
      }
    }
  }

  return { respostas, itensTexto, naoPorItem, unidades };
}

export function computar(kind: Kind, spec: { topN?: number }, b: BaseDados): Computed {
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
    const bars = [...b.naoPorItem.entries()]
      .map(([id, value]) => ({ label: b.itensTexto.get(id) ?? "—", value }))
      .sort((a, b2) => b2.value - a.value)
      .slice(0, topN);
    return { kind: "nao_por_pergunta", bars };
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
