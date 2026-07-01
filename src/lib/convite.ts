import { randomBytes } from "crypto";

// Token de convite/definição de senha PRÓPRIO (não é OTP do Supabase, então não
// expira por tempo). Só deixa de valer quando o cadastro é concluído
// (profiles.convite_usado_em) ou quando um novo é gerado (sobrescreve o token).
export function novoConviteToken(): string {
  return randomBytes(32).toString("hex");
}
