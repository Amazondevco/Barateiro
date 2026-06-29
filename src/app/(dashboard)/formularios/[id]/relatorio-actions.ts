"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { transcribeAudio } from "@/lib/transcribe";
import { KINDS, KIND_LABEL, type Kind } from "@/lib/relatorios";

export type RelState = { error?: string; ok?: boolean };

const CATALOGO = (KINDS as readonly string[])
  .map((k) => `- "${k}": ${KIND_LABEL[k as Kind]}`)
  .join("\n");

const SYSTEM = `Você cria PAINÉIS de relatórios para checklists operacionais de supermercado.
Escolha apenas relatórios da lista de tipos (kind) abaixo — não invente outros:
${CATALOGO}

Regras:
- "nao_por_pergunta", "evolucao", "por_unidade" e "volume" só fazem sentido se o formulário tiver perguntas de conformidade (sim/não, ok/não, abastecido/ruptura).
- Dê títulos curtos e claros em português.
- "spec" pode ter {"topN": N} para limitar barras (padrão 8).
Responda APENAS JSON válido.`;

async function callGroq(user: string): Promise<unknown | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return JSON.parse(json?.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return null;
  }
}

type Proposta = { titulo: string; kind: Kind; spec: { topN?: number } };

function validar(arr: unknown): Proposta[] {
  if (!Array.isArray(arr)) return [];
  const out: Proposta[] = [];
  for (const r of arr) {
    const o = r as { titulo?: unknown; kind?: unknown; spec?: { topN?: unknown } };
    const kind = String(o.kind ?? "") as Kind;
    if (!(KINDS as readonly string[]).includes(kind)) continue;
    const titulo = String(o.titulo ?? "").trim() || KIND_LABEL[kind];
    const topN = Number(o.spec?.topN);
    out.push({ titulo, kind, spec: Number.isFinite(topN) ? { topN } : {} });
  }
  return out;
}

async function contexto(formId: string) {
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" && profile?.papel !== "super_admin") {
    return null;
  }
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("formularios")
    .select("rede_id, nome, descricao, formulario_secoes(titulo, formulario_itens(texto, tipo))")
    .eq("id", formId)
    .single();
  if (!form) return null;
  return { supabase, form: form as FormCtx };
}

type FormCtx = {
  rede_id: string;
  nome: string;
  descricao: string | null;
  formulario_secoes: { titulo: string; formulario_itens: { texto: string; tipo: string }[] }[];
};

function resumoForm(f: FormCtx): string {
  const linhas = f.formulario_secoes
    .map(
      (s) =>
        `Seção "${s.titulo}": ${s.formulario_itens.map((i) => `${i.texto} (${i.tipo})`).join("; ")}`,
    )
    .join("\n");
  return `Formulário: ${f.nome}\n${f.descricao ?? ""}\n${linhas}`;
}

async function inserir(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
  redeId: string,
  props: Proposta[],
  origem: "ia" | "manual",
  ordemBase: number,
) {
  const linhas = props.map((p, i) => ({
    formulario_id: formId,
    rede_id: redeId,
    titulo: p.titulo,
    kind: p.kind,
    spec: p.spec,
    origem,
    ordem: ordemBase + i,
  }));
  if (linhas.length) await supabase.from("relatorios").insert(linhas);
}

// Gera (ou regenera) o painel automático da IA — substitui os de origem 'ia'.
export async function gerarPainelIA(formId: string): Promise<RelState> {
  const ctx = await contexto(formId);
  if (!ctx) return { error: "Sem permissão." };
  const { supabase, form } = ctx;

  const out = await callGroq(
    `${resumoForm(form)}\n\nProponha de 3 a 5 relatórios importantes para este formulário. Responda JSON: {"relatorios":[{"titulo","kind","spec"}]}`,
  );
  const props = validar((out as { relatorios?: unknown })?.relatorios);
  if (!props.length) return { error: "A IA não conseguiu propor relatórios. Tente de novo." };

  await supabase.from("relatorios").delete().eq("formulario_id", formId).eq("origem", "ia");
  await inserir(supabase, formId, form.rede_id, props, "ia", 0);
  revalidatePath(`/formularios/${formId}`);
  return { ok: true };
}

// Novo relatório a partir de descrição (texto ou áudio).
export async function novoRelatorio(
  formId: string,
  _prev: RelState,
  formData: FormData,
): Promise<RelState> {
  const ctx = await contexto(formId);
  if (!ctx) return { error: "Sem permissão." };
  const { supabase, form } = ctx;

  let desc = String(formData.get("descricao") ?? "").trim();
  const audio = String(formData.get("audio") ?? "");
  if (!desc && audio) desc = await transcribeAudio(audio);
  if (!desc) return { error: "Descreva o relatório (texto ou áudio)." };

  const out = await callGroq(
    `${resumoForm(form)}\n\nO usuário quer este relatório: "${desc}".\nEscolha 1 relatório que melhor atende. Responda JSON: {"relatorios":[{"titulo","kind","spec"}]}`,
  );
  const props = validar((out as { relatorios?: unknown })?.relatorios).slice(0, 1);
  if (!props.length) return { error: "Não entendi. Tente descrever de outro jeito." };

  const { count } = await supabase
    .from("relatorios")
    .select("id", { count: "exact", head: true })
    .eq("formulario_id", formId);
  await inserir(supabase, formId, form.rede_id, props, "manual", count ?? 100);
  revalidatePath(`/formularios/${formId}`);
  return { ok: true };
}

export async function excluirRelatorio(formId: string, id: string): Promise<RelState> {
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" && profile?.papel !== "super_admin") {
    return { error: "Sem permissão." };
  }
  const supabase = await createClient();
  await supabase.from("relatorios").delete().eq("id", id);
  revalidatePath(`/formularios/${formId}`);
  return { ok: true };
}
