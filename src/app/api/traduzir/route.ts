import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Traduz textos de CONTEÚDO (nome/perguntas do checklist) para o app nativo, sob
// demanda. O app guarda o resultado em cache no aparelho — então cada texto é
// traduzido uma vez. Não altera nada no banco; é só para exibir na tela do
// operador. Respostas continuam como códigos (o admin vê no idioma dele).
const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const NOMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "sem token" }, { status: 401, headers: cors });
  }

  // Só usuários autenticados (evita abuso da chave).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "não autorizado" }, { status: 401, headers: cors });
  }

  let textos: string[] = [];
  let lang = "";
  try {
    const body = (await req.json()) as { textos?: unknown; lang?: unknown };
    if (Array.isArray(body?.textos)) textos = body.textos.map((s) => String(s));
    lang = String(body?.lang ?? "");
  } catch {
    return Response.json({ error: "corpo inválido" }, { status: 400, headers: cors });
  }

  const alvo = NOMES[lang];
  const key = process.env.GROQ_API_KEY;
  if (!alvo || textos.length === 0 || !key) {
    // Sem idioma válido / sem chave → devolve os originais (o app cai no PT).
    return Response.json({ traducoes: textos }, { headers: cors });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_TRANSLATE_MODEL || "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You translate short checklist/UI strings from Brazilian Portuguese to " +
              alvo +
              '. Keep meaning, tone and any placeholders like {n}. Return ONLY JSON: {"t": [\"...\"]} with the translations in the SAME order and SAME length as the input array. Do not add explanations.',
          },
          { role: "user", content: JSON.stringify({ textos }) },
        ],
      }),
    });
    if (!res.ok) return Response.json({ traducoes: textos }, { headers: cors });
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { t?: unknown };
    const arr = Array.isArray(parsed?.t) ? parsed.t.map((s) => String(s)) : [];
    // Garante mesmo tamanho: onde faltar, mantém o original.
    const traducoes = textos.map((orig, i) => arr[i] ?? orig);
    return Response.json({ traducoes }, { headers: cors });
  } catch {
    return Response.json({ traducoes: textos }, { headers: cors });
  }
}
