"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type Msg = { role: "user" | "assistant"; content: string };
export type Resposta = { resposta: string; source: "groq" | "local" | "policy" };

// Termos sensíveis → recusa imediata (qualquer papel).
const PROIBIDOS =
  /\b(token|senha|password|hash|secret|api[\s_-]?key|service[\s_-]?role|\.env|chave\s+(de\s+)?(api|servi))/i;

const REDE_PROMPT = `Você é o assistente do Check.AI para o ADMIN de UMA rede de supermercado.
Responda SOMENTE com base no CONTEXTO fornecido (dados da rede dele).
NUNCA fale de outras redes, de dados internos do sistema, nem de credenciais.
Não invente números fora do contexto. Se não souber, diga que não tem o dado.
Seja objetivo, em português do Brasil.`;

const SUPER_PROMPT = `Você é o assistente do Check.AI para o SUPER ADMIN (plataforma).
Por padrão você enxerga AGREGADOS por rede (números/totais), NÃO o conteúdo dos checklists.
Se o usuário pediu o conteúdo de uma rede específica e ele aparecer no campo "conteudo_auditado" do CONTEXTO, pode usá-lo — esse acesso foi registrado em auditoria.
Responda com base no CONTEXTO. Não exponha credenciais nem invente dados.
Seja objetivo, em português do Brasil.`;

export async function perguntarAssistente(mensagens: Msg[]): Promise<Resposta> {
  const profile = await getSessionProfile();
  if (profile?.papel !== "super_admin" && profile?.papel !== "admin_supermercado")
    return { resposta: "Acesso não autorizado.", source: "policy" };

  const ultima = mensagens[mensagens.length - 1]?.content ?? "";
  if (PROIBIDOS.test(ultima))
    return {
      resposta:
        "Não posso falar sobre credenciais, chaves ou dados sensíveis do sistema.",
      source: "policy",
    };

  let contexto: string;
  let system: string;
  if (profile.papel === "super_admin") {
    contexto = await buildSuperContext(ultima);
    system = SUPER_PROMPT;
  } else {
    const supabase = await createClient();
    contexto = await buildRedeContext(supabase, profile.rede_id!);
    system = REDE_PROMPT;
  }

  return callGroq(system, contexto, mensagens);
}

// ---- Contexto da REDE (sessão do usuário → RLS isola fisicamente) ----
async function buildRedeContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  redeId: string,
): Promise<string> {
  const hoje = new Date().toISOString().slice(0, 10);
  const [unidades, deptos, membros, forms, roster, respHoje, respTotal, respFora, sug] =
    await Promise.all([
      supabase.from("unidades").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("status", "ativo"),
      supabase.from("departamentos").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("status", "ativo"),
      supabase.from("rede_membros").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("status", "ativo"),
      supabase.from("formularios").select("nome,status").eq("rede_id", redeId),
      supabase.from("rede_roster").select("status").eq("rede_id", redeId),
      supabase.from("respostas").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("data_referencia", hoje),
      supabase.from("respostas").select("id", { count: "exact", head: true }).eq("rede_id", redeId),
      supabase.from("respostas").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("status", "fora_prazo"),
      supabase.from("sugestoes").select("id", { count: "exact", head: true }).eq("rede_id", redeId).eq("destino", "rede").eq("status", "nova"),
    ]);

  const rosterArr = roster.data ?? [];
  return JSON.stringify({
    rede: { unidades_ativas: unidades.count ?? 0, departamentos_ativos: deptos.count ?? 0, membros_ativos: membros.count ?? 0 },
    equipe_app: {
      total_no_roster: rosterArr.length,
      ja_cadastrados: rosterArr.filter((r) => r.status === "vinculado").length,
      aguardando: rosterArr.filter((r) => r.status === "aguardando").length,
    },
    formularios: {
      total: (forms.data ?? []).length,
      ativos: (forms.data ?? []).filter((f) => f.status === "ativo").length,
      nomes: (forms.data ?? []).map((f) => f.nome).slice(0, 30),
    },
    respostas: { hoje: respHoje.count ?? 0, total: respTotal.count ?? 0, fora_do_prazo: respFora.count ?? 0 },
    sugestoes_novas: sug.count ?? 0,
  });
}

// ---- Contexto do SUPER ADMIN: agregados por padrão; conteúdo SÓ sob auditoria ----
async function buildSuperContext(pergunta: string): Promise<string> {
  const admin = createAdminClient();
  const { data: redes } = await admin.from("redes").select("id,nome").order("nome");
  const lista = redes ?? [];

  const porRede = await Promise.all(
    lista.map(async (r) => {
      const [membros, forms, resp] = await Promise.all([
        admin.from("rede_membros").select("id", { count: "exact", head: true }).eq("rede_id", r.id).eq("status", "ativo"),
        admin.from("formularios").select("id", { count: "exact", head: true }).eq("rede_id", r.id).eq("status", "ativo"),
        admin.from("respostas").select("id", { count: "exact", head: true }).eq("rede_id", r.id),
      ]);
      return {
        rede: r.nome,
        membros_ativos: membros.count ?? 0,
        formularios_ativos: forms.count ?? 0,
        respostas_total: resp.count ?? 0,
      };
    }),
  );

  const [identidades, sugEscaladas] = await Promise.all([
    admin.from("identidades").select("id", { count: "exact", head: true }),
    admin.from("sugestoes").select("id", { count: "exact", head: true }).eq("destino", "plataforma").eq("status", "nova"),
  ]);

  const base = {
    plataforma: {
      total_redes: lista.length,
      total_contas_app: identidades.count ?? 0,
      sugestoes_escaladas_novas: sugEscaladas.count ?? 0,
    },
    por_rede: porRede, // SOMENTE números — nenhum conteúdo de checklist
  };

  // Conteúdo de uma rede só se o super admin pediu explicitamente → AUDITADO.
  const q = pergunta.toLowerCase();
  const querConteudo =
    /(respostas?|checklist|conte[úu]do|detalhe|preench|o que responder|fora do prazo)/.test(q);
  const redeAlvo = lista.find((r) => r.nome && q.includes(r.nome.toLowerCase()));
  if (querConteudo && redeAlvo) {
    const supabase = await createClient(); // sessão do super admin → registra a auditoria com o usuário certo
    const { data } = await supabase.rpc("super_ver_conteudo_rede", { p_rede: redeAlvo.id });
    return JSON.stringify({
      ...base,
      conteudo_auditado: { rede: redeAlvo.nome, registrado_em_auditoria: true, respostas_recentes: data },
    });
  }

  return JSON.stringify(base);
}

// ---- Groq (mesmo padrão do gerador de formulários) ----
async function callGroq(system: string, contexto: string, mensagens: Msg[]): Promise<Resposta> {
  const key = process.env.GROQ_API_KEY;
  const fallback = `No momento não consegui usar a IA. Aqui estão os números atuais:\n${contexto}`;
  if (!key) return { resposta: fallback, source: "local" };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          { role: "system", content: `${system}\n\nCONTEXTO (JSON):\n${contexto}` },
          ...mensagens.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) return { resposta: fallback, source: "local" };
    const json = await res.json();
    const resposta: string = json?.choices?.[0]?.message?.content ?? "";
    return { resposta: resposta || fallback, source: "groq" };
  } catch {
    return { resposta: fallback, source: "local" };
  }
}
