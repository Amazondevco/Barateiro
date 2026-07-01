"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { novoConviteToken } from "@/lib/convite";
import type { Papel } from "@/lib/types";

export type FormState = {
  error?: string;
  ok?: boolean;
  // Ao criar usuário: link de acesso gerado (o usuário define a própria senha).
  link?: string;
  email?: string;
};

// Gera um link de acesso (recuperação → o usuário define a própria senha) para
// UM usuário, guarda em profiles.convite_link e devolve para copiar/enviar.
export async function gerarLinkUsuario(
  userId: string,
): Promise<{ ok?: boolean; error?: string; link?: string; email?: string }> {
  const caller = await getSessionProfile();
  if (!caller || (caller.papel !== "super_admin" && caller.papel !== "admin_supermercado")) {
    return { error: "Sem permissão." };
  }
  const admin = createAdminClient();
  const { data: u } = await admin
    .from("profiles")
    .select("email, rede_id, nome")
    .eq("id", userId)
    .single();
  if (!u?.email) return { error: "Usuário sem e-mail." };
  if (caller.papel === "admin_supermercado" && u.rede_id !== caller.rede_id) {
    return { error: "Sem permissão." };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return { error: "Não foi possível gerar o link.", email: u.email };

  // Token PRÓPRIO (não OTP do Supabase) → o link não expira por tempo. Só deixa
  // de valer quando o cadastro é concluído ou quando este método gera outro
  // (o convite_token é sobrescrito). À prova de prefetch: visitar não consome.
  const token = novoConviteToken();
  const params = new URLSearchParams({ convite: token });
  params.set("email", u.email);
  if (u.nome) params.set("nome", u.nome);
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

  if (u.rede_id) revalidatePath(`/clientes/${u.rede_id}`);
  return { ok: true, link, email: u.email };
}

export async function createUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const caller = await getSessionProfile();
  if (!caller) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("papel") ?? "gerente") as Papel;
  let rede_id: string | null =
    String(formData.get("rede_id") ?? "").trim() || null;
  const departamentoId =
    String(formData.get("departamento_id") ?? "").trim() || null;
  const unidadeIds = formData.getAll("unidade_ids").map((u) => String(u));

  if (!nome || !email) return { error: "Preencha nome e e-mail." };

  // Autorização
  if (caller.papel === "admin_supermercado") {
    if (papel === "super_admin")
      return { error: "Você não pode criar Super Admin." };
    rede_id = caller.rede_id; // admin só cria na própria rede
  } else if (caller.papel !== "super_admin") {
    return { error: "Sem permissão." };
  }

  if (papel === "super_admin") rede_id = null;
  else if (!rede_id) return { error: "Selecione a rede do usuário." };

  // Usuário de uma rede precisa pertencer a um departamento
  if (rede_id && !departamentoId)
    return { error: "Selecione o departamento do usuário." };

  // Cria a conta SEM senha — o próprio usuário define a dele pelo link de acesso
  // (que não expira por tempo). email_confirm evita a etapa de confirmar e-mail.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nome, papel, rede_id },
  });

  if (error) return { error: error.message };
  const userId = data.user?.id;

  // Departamento do usuário
  if (userId && departamentoId) {
    await admin
      .from("profiles")
      .update({ departamento_id: departamentoId })
      .eq("id", userId);
  }

  // Vínculo com unidades (gerente)
  if (userId && unidadeIds.length) {
    await admin
      .from("usuario_unidades")
      .insert(unidadeIds.map((unidade_id) => ({ user_id: userId, unidade_id })));
  }

  revalidatePath("/usuarios");
  if (rede_id) revalidatePath(`/clientes/${rede_id}`);

  // Gera o link de acesso para o usuário definir a própria senha.
  let link: string | undefined;
  if (userId) {
    const r = await gerarLinkUsuario(userId);
    if (r.ok) link = r.link;
  }
  return { ok: true, link, email };
}

export async function updateUsuario(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const caller = await getSessionProfile();
  if (!caller) return { error: "Sessão expirada." };
  if (caller.papel !== "super_admin" && caller.papel !== "admin_supermercado")
    return { error: "Sem permissão." };

  const admin = createAdminClient();
  const { data: alvo } = await admin
    .from("profiles")
    .select("rede_id")
    .eq("id", id)
    .single();
  if (!alvo) return { error: "Usuário não encontrado." };

  const nome = String(formData.get("nome") ?? "").trim();
  const papel = String(formData.get("papel") ?? "gerente") as Papel;
  const departamentoId =
    String(formData.get("departamento_id") ?? "").trim() || null;
  const status =
    String(formData.get("status") ?? "ativo") === "inativo"
      ? "inativo"
      : "ativo";

  if (!nome) return { error: "Informe o nome." };

  // Admin só edita usuários da própria rede e não promove a Super Admin
  if (caller.papel === "admin_supermercado") {
    if (alvo.rede_id !== caller.rede_id)
      return { error: "Sem permissão." };
    if (papel === "super_admin")
      return { error: "Você não pode definir Super Admin." };
  }

  if (alvo.rede_id && !departamentoId)
    return { error: "Selecione o departamento do usuário." };

  const { error } = await admin
    .from("profiles")
    .update({
      nome,
      papel,
      status,
      departamento_id: alvo.rede_id ? departamentoId : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
  if (alvo.rede_id) revalidatePath(`/clientes/${alvo.rede_id}`);
  return { ok: true };
}

export async function setUsuarioStatus(
  id: string,
  status: "ativo" | "inativo",
) {
  const caller = await getSessionProfile();
  if (!caller || (caller.papel !== "super_admin" && caller.papel !== "admin_supermercado"))
    return;
  const admin = createAdminClient();
  await admin.from("profiles").update({ status }).eq("id", id);
  revalidatePath("/usuarios");
}
