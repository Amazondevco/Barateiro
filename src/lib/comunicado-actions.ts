"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { getRedeMarcaById } from "@/lib/rede-branding";
import { sendPush } from "@/lib/fcm";

const CHECKAI_GREEN = "#15803d";

// Imagem (logo) e cor de acento do push, conforme quem envia:
// - super admin            → logo Check.AI (imagem padrão de /api/app-icon) + verde.
// - admin/gerente com logo  → logo da rede (/api/app-icon?rede=…) + cor da rede.
// - rede sem logo           → logo Check.AI + verde.
async function brandingDoPush(
  rede: string,
): Promise<{ imageUrl?: string; color: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : null;
  const checkai = base ? `${base}/api/app-icon` : undefined;

  const { profile } = await getSessionContext();
  if (profile?.papel === "super_admin") {
    return { imageUrl: checkai, color: CHECKAI_GREEN };
  }

  const marca = await getRedeMarcaById(rede);
  if (marca?.logo_url && base) {
    return {
      imageUrl: `${base}/api/app-icon?rede=${rede}`,
      color: marca.app_cor || marca.cor_primaria || CHECKAI_GREEN,
    };
  }
  return { imageUrl: checkai, color: marca?.app_cor || CHECKAI_GREEN };
}

export type AlvoTipo = "todos" | "usuario" | "unidade" | "departamento" | "cargo";

export type RedeAlvos = {
  unidades: { id: string; nome: string }[];
  departamentos: { id: string; nome: string }[];
  cargos: { id: string; nome: string }[];
  usuarios: { id: string; nome: string }[];
};

// Resolve quem o autor pode atingir: super admin → qualquer rede;
// admin/gerente → apenas a própria. Retorna a rede efetiva ou null (negado).
async function redeEfetiva(redeId: string | null): Promise<string | null> {
  const { profile } = await getSessionContext();
  if (!profile) return null;
  if (profile.papel === "super_admin") return redeId; // escolhe a rede
  if (
    (profile.papel === "admin_supermercado" || profile.papel === "gerente") &&
    profile.rede_id
  ) {
    return profile.rede_id; // sempre a própria, ignora o que veio do cliente
  }
  return null;
}

// Listas de alvos de uma rede (unidades, departamentos, cargos, usuários do app).
// Service role + guard de papel: super admin lê qualquer rede; admin só a sua.
export async function getRedeAlvos(redeId: string): Promise<RedeAlvos> {
  const rede = await redeEfetiva(redeId);
  if (!rede) return { unidades: [], departamentos: [], cargos: [], usuarios: [] };

  const admin = createAdminClient();
  const [{ data: unidades }, { data: departamentos }, { data: cargos }, { data: membros }] =
    await Promise.all([
      admin.from("unidades").select("id, nome").eq("rede_id", rede).order("nome"),
      admin.from("departamentos").select("id, nome").eq("rede_id", rede).order("nome"),
      admin.from("cargos").select("id, nome").eq("rede_id", rede).order("nome"),
      admin
        .from("rede_membros")
        .select("identidade_id, identidades(nome)")
        .eq("rede_id", rede)
        .eq("status", "ativo"),
    ]);

  const usuarios = ((membros ?? []) as Array<Record<string, unknown>>)
    .map((m) => ({
      id: String(m.identidade_id),
      nome:
        typeof m.identidades === "object" && m.identidades && "nome" in m.identidades
          ? String((m.identidades as { nome: string | null }).nome ?? "Sem nome")
          : "Sem nome",
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    unidades: (unidades ?? []) as RedeAlvos["unidades"],
    departamentos: (departamentos ?? []) as RedeAlvos["departamentos"],
    cargos: (cargos ?? []) as RedeAlvos["cargos"],
    usuarios,
  };
}

// Resolve os device_tokens dos membros atingidos pelo alvo do comunicado.
// Espelha a lógica de RLS de `comunicados_app_select`.
async function tokensDoAlvo(
  rede: string,
  alvoTipo: AlvoTipo,
  alvoIds: string[],
): Promise<string[]> {
  const admin = createAdminClient();

  let q = admin
    .from("rede_membros")
    .select("identidade_id")
    .eq("rede_id", rede)
    .eq("status", "ativo");

  if (alvoTipo === "usuario") q = q.in("identidade_id", alvoIds);
  else if (alvoTipo === "unidade") q = q.in("unidade_id", alvoIds);
  else if (alvoTipo === "departamento") q = q.in("departamento_id", alvoIds);
  else if (alvoTipo === "cargo") q = q.in("cargo_id", alvoIds);

  const { data: membros } = await q;
  const ids = [...new Set((membros ?? []).map((m) => String(m.identidade_id)))];
  if (ids.length === 0) return [];

  const { data: tokens } = await admin
    .from("device_tokens")
    .select("token")
    .in("identidade_id", ids);
  return (tokens ?? []).map((t) => String(t.token));
}

// IA: a partir da intenção do gestor, redige título + mensagem do comunicado.
// Mesmo padrão Groq do gerador de formulários (server-only, usa GROQ_API_KEY).
export async function gerarComunicado(
  descricao: string,
): Promise<{ titulo?: string; corpo?: string; error?: string }> {
  const desc = descricao.trim();
  if (!desc) return { error: "Descreva a intenção do comunicado." };

  const { profile } = await getSessionContext();
  if (!profile) return { error: "Sessão expirada." };

  const key = process.env.GROQ_API_KEY;
  if (!key) return { error: "IA não configurada (defina GROQ_API_KEY)." };

  const SYSTEM =
    "Você redige comunicados internos para funcionários de uma rede de " +
    "supermercados, em português do Brasil. A partir da intenção do gestor, " +
    "gere um TÍTULO objetivo (máx. ~60 caracteres, sem ponto final) e uma " +
    "MENSAGEM cordial e direta (1 a 3 frases curtas, tom profissional e " +
    "acessível). Não invente datas, números, nomes ou políticas que não " +
    'estejam na intenção. Responda APENAS em JSON: {"titulo": "...", "corpo": "..."}.';

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: desc },
        ],
      }),
    });
    if (!res.ok) return { error: `IA respondeu ${res.status}. Tente novamente.` };
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text) as { titulo?: string; corpo?: string };
    const titulo = String(parsed.titulo ?? "").trim().slice(0, 120);
    const corpo = String(parsed.corpo ?? "").trim();
    if (!titulo || !corpo) return { error: "A IA não conseguiu gerar. Detalhe mais." };
    return { titulo, corpo };
  } catch {
    return { error: "Não foi possível gerar agora. Tente novamente." };
  }
}

export async function enviarComunicado(input: {
  redeId: string | null;
  titulo: string;
  corpo: string;
  alvoTipo: AlvoTipo;
  alvoIds: string[];
}): Promise<{ ok?: boolean; error?: string; pushEnviados?: number; pushTotal?: number }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) return { error: "Sessão expirada." };

  const rede = await redeEfetiva(input.redeId);
  if (!rede) return { error: "Selecione uma rede válida." };

  const titulo = input.titulo.trim();
  const corpo = input.corpo.trim();
  if (!titulo || !corpo) return { error: "Preencha título e mensagem." };

  if (input.alvoTipo !== "todos" && input.alvoIds.length === 0) {
    return { error: "Escolha pelo menos um destinatário para o alvo selecionado." };
  }

  const alvoIds = input.alvoTipo === "todos" ? [] : input.alvoIds;

  const { error } = await supabase.from("comunicados").insert({
    rede_id: rede,
    autor_id: sub,
    titulo,
    corpo,
    alvo_tipo: input.alvoTipo,
    alvo_ids: alvoIds,
  });
  if (error) return { error: error.message };

  // Push (best effort): resolve os tokens do alvo e dispara via FCM. Se a
  // credencial não estiver configurada, sendPush é no-op — o comunicado já
  // chega pela inbox (aba Avisos). Nunca falha o envio por causa do push.
  let pushEnviados = 0;
  let pushTotal = 0;
  try {
    const tokens = await tokensDoAlvo(rede, input.alvoTipo, alvoIds);
    pushTotal = tokens.length;
    if (tokens.length > 0) {
      const { imageUrl, color } = await brandingDoPush(rede);
      const { sent, invalid } = await sendPush(tokens, {
        title: titulo,
        body: corpo,
        imageUrl,
        color,
        data: { tipo: "comunicado", rede_id: rede, color },
      });
      pushEnviados = sent;
      if (invalid.length > 0) {
        await createAdminClient().from("device_tokens").delete().in("token", invalid);
      }
    }
  } catch (e) {
    console.error("[comunicado] push falhou (ignorado):", e);
  }

  revalidatePath("/comunicados");
  return { ok: true, pushEnviados, pushTotal };
}
