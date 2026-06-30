"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { enviarEmail, emailConviteHtml } from "@/lib/email";

export type FormState = { error?: string; ok?: boolean };

// Convida o responsável (contato) da rede a se cadastrar como admin dela.
// Cria/recupera o usuário no Auth com metadata (papel/rede_id) — o trigger
// handle_new_user provisiona o profile — gera o link e envia um e-mail com a
// marca Check.AI via Resend (não usa o e-mail do Supabase → sem rate limit).
export async function convidarResponsavel(
  redeId: string,
): Promise<{ ok?: boolean; error?: string; email?: string }> {
  const { profile } = await getSessionContext();
  if (profile?.papel !== "super_admin") {
    return { error: "Apenas super admin pode convidar responsáveis." };
  }

  const admin = createAdminClient();
  const { data: rede } = await admin
    .from("redes")
    .select("id, nome, contato_nome, contato_email")
    .eq("id", redeId)
    .single();

  const email = rede?.contato_email?.trim();
  if (!email) {
    return { error: "Esta rede não tem e-mail de contato cadastrado." };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const redirectTo = host ? `${proto}://${host}/auth/redefinir` : undefined;

  // Gera o link (sem enviar e-mail pelo Supabase). 1º como convite (cria a
  // conta); se já existir, como recuperação (cai na mesma tela de cadastro).
  let link: string | undefined;
  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: {
        nome: rede?.contato_nome ?? "",
        papel: "admin_supermercado",
        rede_id: rede!.id,
      },
      redirectTo,
    },
  });
  if (invite.error) {
    const msg = invite.error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      const rec = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (rec.error) return { error: rec.error.message, email };
      link = rec.data.properties?.action_link;
    } else {
      return { error: invite.error.message, email };
    }
  } else {
    link = invite.data.properties?.action_link;
  }

  if (!link) return { error: "Não foi possível gerar o link do convite.", email };

  const html = await emailConviteHtml({
    redeNome: rede?.nome ?? "sua rede",
    contatoNome: rede?.contato_nome ?? "",
    link,
  });
  const sent = await enviarEmail({
    to: email,
    subject: `Convite — administrar ${rede?.nome ?? "sua rede"} no Check.AI`,
    html,
  });
  if (sent.error) return { error: sent.error, email };

  return { ok: true, email };
}

function parseRede(formData: FormData) {
  const dias = formData
    .getAll("dias_frequencia")
    .map((d) => parseInt(String(d), 10))
    .filter((n) => !Number.isNaN(n))
    .sort();

  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cnpj: String(formData.get("cnpj") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#2563eb"),
    plano: String(formData.get("plano") ?? "free"),
    contato_nome: String(formData.get("contato_nome") ?? "").trim() || null,
    contato_email: String(formData.get("contato_email") ?? "").trim() || null,
    contato_fone: String(formData.get("contato_fone") ?? "").trim() || null,
    horario_limite: String(formData.get("horario_limite") ?? "10:00"),
    dias_frequencia: dias.length ? dias : [1, 3, 5, 6],
    janela_edicao_min: parseInt(
      String(formData.get("janela_edicao_min") ?? "30"),
      10,
    ),
    retencao_fotos_dias: parseInt(
      String(formData.get("retencao_fotos_dias") ?? "60"),
      10,
    ),
  };
}

export async function createRede(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = parseRede(formData);
  if (!payload.nome) return { error: "Informe o nome da rede." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redes")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Convida o responsável automaticamente (best-effort; não bloqueia a criação).
  if (payload.contato_email) {
    try {
      await convidarResponsavel(data.id);
    } catch {
      /* o convite pode ser reenviado depois na tela da rede */
    }
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateRede(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = parseRede(formData);
  if (!payload.nome) return { error: "Informe o nome da rede." };

  const supabase = await createClient();
  const { error } = await supabase.from("redes").update(payload).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true };
}

export async function setRedeStatus(id: string, status: "ativo" | "inativo") {
  const supabase = await createClient();
  await supabase.from("redes").update({ status }).eq("id", id);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
