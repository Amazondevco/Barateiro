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
Gere a estrutura de um formulário de checklist a partir da entrada do usuário (descrição em texto OU conteúdo de um formulário impresso para digitalizar).

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
- Itens objetivos e verificáveis ("Produtos dentro da validade", "Balança calibrada").
- Use "ok_nao" como padrão; "sim_nao" para perguntas de sim/não (ex.: "Temperatura dentro do padrão?"); "abastecido_ruptura" para checagem de abastecimento de gôndola.
- Itens críticos (limpeza, validade, temperatura, segurança): "obriga_obs": true e "obriga_foto": true.
- Agrupe em seções lógicas por área/departamento.
- MOBILE-FIRST: o preenchimento será no CELULAR. Itens curtos, diretos e fáceis de marcar com o polegar. Evite frases longas.
- Ao digitalizar um documento: preserve as seções e itens existentes, converta em itens verificáveis e descarte cabeçalhos/rodapés/assinaturas irrelevantes.
- Português do Brasil.`;

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
    secoes: secoes.filter((s) => s.itens.length),
  };
}

async function callGroq(userMessage: string): Promise<AiResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key)
    return { error: "IA ainda não configurada. Defina GROQ_API_KEY no servidor." };

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 6000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userMessage },
          ],
        }),
      },
    );
    if (!res.ok)
      return { error: `Falha ao gerar (IA respondeu ${res.status}).` };
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    const data = normalize(JSON.parse(extractJson(text)));
    if (!data.secoes.length)
      return { error: "A IA não conseguiu estruturar. Tente detalhar mais." };
    return { ok: true, data };
  } catch {
    return { error: "Não foi possível gerar o formulário. Tente novamente." };
  }
}

export async function generateFormulario(
  descricao: string,
): Promise<AiResult> {
  if (!descricao.trim())
    return { error: "Descreva o que o formulário precisa verificar." };
  return callGroq(descricao);
}

// ---- Importar de arquivo (PDF / Word / Excel / texto) ----

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    // @ts-expect-error pdf-parse não tem tipos para este subpath
    const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = pdfMod.default as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdf(buf);
    return data.text ?? "";
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value ?? "";
  }
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    return wb.SheetNames.map((n) =>
      XLSX.utils.sheet_to_csv(wb.Sheets[n]),
    ).join("\n\n");
  }
  return buf.toString("utf8");
}

export async function importFormulario(
  formData: FormData,
): Promise<AiResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecione um arquivo." };
  if (file.size > 12 * 1024 * 1024)
    return { error: "Arquivo muito grande (máx. 12MB)." };

  let text = "";
  try {
    text = await extractText(file);
  } catch {
    return { error: "Não consegui ler esse arquivo. Tente PDF, Word ou Excel." };
  }
  text = text.replace(/[ \t]+\n/g, "\n").trim().slice(0, 30000);
  if (text.length < 20)
    return {
      error:
        "O arquivo não tem texto legível (pode ser uma imagem escaneada). Use um PDF/Word com texto ou digite a descrição.",
    };

  return callGroq(
    `Digitalize o formulário impresso abaixo em um checklist digital estruturado e mobile-first, preservando seções e itens. Conteúdo extraído do arquivo:\n\n${text}`,
  );
}
