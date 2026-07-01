"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { validarSenha } from "@/lib/senha";

// Consome o convite PRÓPRIO (token guardado em profiles.convite_token) e define
// a senha via admin API. Não depende de token OTP do Supabase → NÃO expira por
// tempo. O link só deixa de valer quando:
//   (a) o cadastro é concluído  → convite_usado_em preenchido aqui; ou
//   (b) o admin gera outro link → convite_token é sobrescrito (não casa mais).
export async function definirSenhaPorConvite(
  token: string,
  senha: string,
): Promise<{ ok?: boolean; error?: string; email?: string }> {
  const t = (token ?? "").trim();
  if (!t) return { error: "Link inválido — peça um novo ao administrador." };

  const erro = validarSenha(senha);
  if (erro) return { error: erro };

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("id, email, convite_usado_em")
    .eq("convite_token", t)
    .maybeSingle();

  if (!prof) {
    return {
      error: "Este link não é mais válido. Peça um novo ao administrador.",
    };
  }
  if (prof.convite_usado_em) {
    return {
      error: "Este link já foi usado. Faça login ou peça um novo.",
    };
  }

  const { error: upErr } = await admin.auth.admin.updateUserById(prof.id, {
    password: senha,
    email_confirm: true,
  });
  if (upErr) {
    return { error: "Não foi possível salvar a senha. Tente novamente." };
  }

  // Marca como concluído → a partir de agora o link não vale mais.
  await admin
    .from("profiles")
    .update({ convite_usado_em: new Date().toISOString() })
    .eq("id", prof.id);

  return { ok: true, email: prof.email ?? undefined };
}
