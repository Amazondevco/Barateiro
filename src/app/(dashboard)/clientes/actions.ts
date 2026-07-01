"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { enviarEmail, emailConviteHtml } from "@/lib/email";
import { novoConviteToken } from "@/lib/convite";

export type FormState = { error?: string; ok?: boolean };

// Convida o responsável (contato) da rede a se cadastrar como admin dela.
// Cria/recupera o usuário no Auth com metadata (papel/rede_id) — o trigger
// handle_new_user provisiona o profile — gera o link e envia um e-mail com a
// marca Check.AI via Resend (não usa o e-mail do Supabase → sem rate limit).
export async function convidarResponsavel(
  redeId: string,
): Promise<{ ok?: boolean; error?: string; email?: string; link?: string; emailEnviado?: boolean }> {
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

  if (!host) return { error: "Não foi possível gerar o link do convite.", email };

  // Garante a conta do responsável no Auth (o trigger handle_new_user provisiona
  // o profile). Usamos generateLink só para CRIAR/localizar o usuário — o link
  // OTP do Supabase é descartado (expira e é vulnerável a prefetch). O acesso
  // usa o NOSSO token, guardado no profile, que não expira por tempo.
  let userId: string | undefined;
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
      // Já existe → localiza o usuário por e-mail.
      const rec = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (rec.error) return { error: rec.error.message, email };
      userId = rec.data.user?.id;
    } else {
      return { error: invite.error.message, email };
    }
  } else {
    userId = invite.data.user?.id;
  }

  if (!userId) return { error: "Não foi possível gerar o link do convite.", email };

  // Token PRÓPRIO → link não expira por tempo (só quando o cadastro é concluído
  // ou quando um novo convite é gerado, sobrescrevendo o convite_token).
  const token = novoConviteToken();
  const params = new URLSearchParams({ convite: token });
  params.set("email", email);
  if (rede?.contato_nome) params.set("nome", rede.contato_nome);
  const link = `${proto}://${host}/auth/redefinir?${params.toString()}`;

  await admin
    .from("profiles")
    .update({
      convite_token: token,
      convite_usado_em: null,
      convite_link: link,
      convite_em: new Date().toISOString(),
    })
    .eq("id", userId);

  // Também guarda no cadastro da rede (para o super admin copiar/reenviar).
  await admin
    .from("redes")
    .update({ convite_link: link, convite_em: new Date().toISOString() })
    .eq("id", redeId);

  // E-mail é best-effort (enquanto o envio não está garantido). O link sempre volta
  // para o super admin copiar e enviar manualmente.
  let emailEnviado = false;
  try {
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
    emailEnviado = !sent.error;
  } catch {
    emailEnviado = false;
  }

  revalidatePath(`/clientes/${redeId}`);
  return { ok: true, email, link, emailEnviado };
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
    tipo_negocio: String(formData.get("tipo_negocio") ?? "").trim() || null,
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
  if (!payload.tipo_negocio) return { error: "Selecione o tipo de negócio." };

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
  if (!payload.tipo_negocio) return { error: "Selecione o tipo de negócio." };

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
