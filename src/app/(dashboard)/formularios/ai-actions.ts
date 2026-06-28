"use server";

import type { SecaoDraft } from "./actions";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

export type AiForm = {
  nome: string;
  descricao: string;
  tipo_unidade: UnidadeTipo;
  secoes: SecaoDraft[];
};
export type AiResult = { ok?: boolean; data?: AiForm; error?: string };

const TIPOS: ItemTipo[] = ["ok_nao", "sim_nao", "abastecido_ruptura"];
const UNIDADES: UnidadeTipo[] = ["loja", "cd", "escritorio", "outro"];

const SYSTEM = `Você é um especialista em formulários digitais de checklist operacional para redes de supermercado.
A partir da descrição do usuário, gere a estrutura de um formulário de checklist.

Responda APENAS com JSON válido (sem markdown, sem comentários), exatamente neste formato:
{
  "nome": string,
  "descricao": string,
  "tipo_unidade": "loja" | "cd" | "escritorio" | "outro",
  "secoes": [
    {
      "titulo": string,
      "permite_na": boolean,
      "itens": [
        { "texto": string, "tipo": "ok_nao" | "sim_nao" | "abastecido_ruptura", "obriga_obs": boolean, "obriga_foto": boolean }
      ]
    }
  ]
}

Regras:
- Itens devem ser objetivos e verificáveis ("Produtos dentro da validade", "Balança calibrada").
- Use "ok_nao" como padrão; "sim_nao" para perguntas de sim/não (ex.: "Temperatura dentro do padrão?"); "abastecido_ruptura" para checagem de abastecimento de gôndola.
- Para itens críticos (limpeza, validade, temperatura, segurança), marque "obriga_obs": true e "obriga_foto": true.
- Agrupe em seções lógicas por área/departamento.
- Português do Brasil. Seja prático e específico ao varejo de supermercado.`;

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function normalize(raw: unknown): AiForm {
  const r = raw as Record<string, unknown>;
  const tipo = String(r.tipo_unidade ?? "loja") as UnidadeTipo;
  const secoesRaw = Array.isArray(r.secoes) ? r.secoes : [];
  const secoes: SecaoDraft[] = secoesRaw.map((s) => {
    const sec = s as Record<string, unknown>;
    const itensRaw = Array.isArray(sec.itens) ? sec.itens : [];
    return {
      titulo: String(sec.titulo ?? "").trim() || "Seção",
      permite_na: sec.permite_na !== false,
      itens: itensRaw
        .map((i) => {
          const it = i as Record<string, unknown>;
          const t = String(it.tipo ?? "ok_nao") as ItemTipo;
          return {
            texto: String(it.texto ?? "").trim(),
            tipo: TIPOS.includes(t) ? t : "ok_nao",
            obriga_obs: it.obriga_obs !== false,
            obriga_foto: it.obriga_foto !== false,
          };
        })
        .filter((it) => it.texto),
    };
  });

  return {
    nome: String(r.nome ?? "").trim() || "Novo formulário",
    descricao: String(r.descricao ?? "").trim(),
    tipo_unidade: UNIDADES.includes(tipo) ? tipo : "loja",
    secoes: secoes.length ? secoes : [],
  };
}

export async function generateFormulario(
  descricao: string,
): Promise<AiResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return {
      error:
        "IA ainda não configurada. Defina ANTHROPIC_API_KEY no servidor.",
    };
  if (!descricao.trim())
    return { error: "Descreva o que o formulário precisa verificar." };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: "user", content: descricao }],
      }),
    });

    if (!res.ok) {
      return { error: `Falha ao gerar (IA respondeu ${res.status}).` };
    }
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const data = normalize(JSON.parse(extractJson(text)));
    if (!data.secoes.length)
      return { error: "A IA não conseguiu estruturar. Tente detalhar mais." };
    return { ok: true, data };
  } catch {
    return { error: "Não foi possível gerar o formulário. Tente novamente." };
  }
}
