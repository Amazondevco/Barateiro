"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ItemDetalhe = { texto: string; valor: string; observacao: string; foto_url: string | null };
export type SecaoDetalhe = { titulo: string; itens: ItemDetalhe[] };
export type RespostaDetalhe = {
  formulario: string;
  unidade: string;
  autor: string;
  data: string;
  status: string;
  total_itens: number;
  total_nao: number;
  assinatura: string | null;
  presenca_ok: boolean | null; // true=no local, false=fora do raio, null=n/a
  lida: boolean; // já lida por algum admin do painel
  secoes: SecaoDetalhe[];
};

const VALOR_LABEL: Record<string, string> = {
  ok: "OK",
  nao: "Não",
  sim: "Sim",
  abastecido: "Abastecido",
  ruptura: "Ruptura",
  na: "N/A",
};
const fmt = (v: string | null) => (v ? VALOR_LABEL[v.toLowerCase()] ?? v : "—");

export async function getRespostaDetalhe(id: string): Promise<RespostaDetalhe | null> {
  const supabase = await createClient();

  const { data: resp } = await supabase
    .from("respostas")
    .select("formulario_id, enviado_em, status, total_itens, total_nao, assinatura_svg, presenca_ok, lida_em, usuario_id, formularios(nome), unidades(nome)")
    .eq("id", id)
    .single();
  if (!resp) return null;
  const r = resp as unknown as {
    formulario_id: string;
    enviado_em: string;
    status: string;
    total_itens: number;
    total_nao: number;
    assinatura_svg: string | null;
    presenca_ok: boolean | null;
    lida_em: string | null;
    usuario_id: string;
    formularios: { nome: string } | null;
    unidades: { nome: string } | null;
  };

  const [{ data: itens }, { data: secoes }, prof, ident] = await Promise.all([
    supabase.from("resposta_itens").select("item_id, valor, observacao, foto_url").eq("resposta_id", id),
    supabase
      .from("formulario_secoes")
      .select("id, titulo, ordem, formulario_itens(id, texto, ordem)")
      .eq("formulario_id", r.formulario_id)
      .order("ordem"),
    supabase.from("profiles").select("nome").eq("id", r.usuario_id).maybeSingle(),
    supabase.from("identidades").select("nome").eq("id", r.usuario_id).maybeSingle(),
  ]);

  type IR = { item_id: string; valor: string | null; observacao: string | null; foto_url: string | null };
  const respMap = new Map(((itens ?? []) as IR[]).map((i) => [i.item_id, i]));

  type Sec = { id: string; titulo: string; ordem: number; formulario_itens: { id: string; texto: string; ordem: number }[] };
  const secsDetalhe: SecaoDetalhe[] = ((secoes ?? []) as Sec[]).map((s) => ({
    titulo: s.titulo,
    itens: [...s.formulario_itens]
      .sort((a, b) => a.ordem - b.ordem)
      .map((it) => {
        const a = respMap.get(it.id);
        return {
          texto: it.texto,
          valor: fmt(a?.valor ?? null),
          observacao: a?.observacao ?? "",
          foto_url: a?.foto_url ?? null,
        };
      }),
  }));

  return {
    formulario: r.formularios?.nome ?? "Checklist",
    unidade: r.unidades?.nome ?? "—",
    autor: (prof.data?.nome ?? ident.data?.nome ?? "—") as string,
    data: r.enviado_em,
    status: r.status,
    total_itens: r.total_itens,
    total_nao: r.total_nao,
    assinatura: r.assinatura_svg,
    presenca_ok: r.presenca_ok,
    lida: r.lida_em != null,
    secoes: secsDetalhe,
  };
}

// Marca a resposta como lida pelo admin (idempotente). Revalida a rota para a
// listagem refletir o "não lida" → "lida".
export async function marcarRespostaLida(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("marcar_resposta_lida", { p_resposta: id });
  revalidatePath("/formularios/[id]", "page");
}

export async function resumirResposta(id: string): Promise<{ resumo: string }> {
  const det = await getRespostaDetalhe(id);
  if (!det) return { resumo: "Não foi possível carregar a resposta." };

  const key = process.env.GROQ_API_KEY;
  const itensTxt = det.secoes
    .map(
      (s) =>
        `${s.titulo}:\n` +
        s.itens.map((i) => `- ${i.texto}: ${i.valor}${i.observacao ? ` (obs: ${i.observacao})` : ""}`).join("\n"),
    )
    .join("\n");
  const contexto = `Checklist: ${det.formulario}\nUnidade: ${det.unidade}\nPreenchido por: ${det.autor}\nNão-conformidades: ${det.total_nao} de ${det.total_itens}\n\n${itensTxt}`;

  if (!key) {
    return {
      resumo: `${det.total_nao} não-conformidade(s) de ${det.total_itens} itens. Configure a IA (GROQ_API_KEY) para um resumo automático.`,
    };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Resuma esta resposta de checklist em 2 a 4 frases. Destaque a conformidade geral e liste as não-conformidades (itens 'Não'/'Ruptura') com as observações. Português do Brasil, objetivo. Não invente dados.",
          },
          { role: "user", content: contexto },
        ],
      }),
    });
    if (!res.ok) return { resumo: "Não consegui gerar o resumo agora." };
    const json = await res.json();
    return { resumo: json?.choices?.[0]?.message?.content ?? "Sem resumo." };
  } catch {
    return { resumo: "Não consegui gerar o resumo agora." };
  }
}
