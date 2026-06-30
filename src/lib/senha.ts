// Política de senha do projeto — usada em TODO lugar que cria/altera senha
// (cadastro, redefinição, criação de usuário pelo admin). As senhas em si são
// guardadas com hash (bcrypt) pelo Supabase Auth; isto aqui é só a validação
// dos critérios. Sem exigência de caractere especial (por decisão do produto).

export const SENHA_MIN = 7;

export const SENHA_REGRAS =
  "Mínimo de 7 caracteres, com pelo menos 1 letra maiúscula e 1 número.";

// Retorna a mensagem de erro (string) ou null se a senha é válida.
export function validarSenha(senha: string): string | null {
  if (senha.length < SENHA_MIN)
    return `A senha precisa ter ao menos ${SENHA_MIN} caracteres.`;
  if (!/[A-Z]/.test(senha))
    return "A senha precisa ter ao menos 1 letra maiúscula.";
  if (!/[0-9]/.test(senha)) return "A senha precisa ter ao menos 1 número.";
  return null;
}

// Checagem item a item — útil para mostrar a lista de critérios na UI.
export function criteriosSenha(senha: string) {
  return [
    { ok: senha.length >= SENHA_MIN, texto: `Ao menos ${SENHA_MIN} caracteres` },
    { ok: /[A-Z]/.test(senha), texto: "1 letra maiúscula" },
    { ok: /[0-9]/.test(senha), texto: "1 número" },
  ];
}
