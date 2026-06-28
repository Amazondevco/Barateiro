"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import type { Papel } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean };

export async function createUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const caller = await getSessionProfile();
  if (!caller) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const papel = String(formData.get("papel") ?? "gerente") as Papel;
  let rede_id: string | null =
    String(formData.get("rede_id") ?? "").trim() || null;
  const departamentoId =
    String(formData.get("departamento_id") ?? "").trim() || null;
  const unidadeIds = formData.getAll("unidade_ids").map((u) => String(u));

  if (!nome || !email || !senha)
    return { error: "Preencha nome, e-mail e senha." };
  if (senha.length < 6)
    return { error: "A senha deve ter ao menos 6 caracteres." };

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

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
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
