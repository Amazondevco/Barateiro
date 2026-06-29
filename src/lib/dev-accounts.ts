// Contas de troca de visualização (Super Admin / Admin / Celular).
// Só aparece para o círculo abaixo (efetivamente a conta amazondevco e seus alvos).
export const DEV_ACCOUNTS = [
  { email: "amazondevco@gmail.com", label: "Super Admin", role: "Plataforma Check.AI", view: "super" },
  { email: "admin@barateiro.com", label: "Admin da rede", role: "Dono Barateiro", view: "admin" },
  { email: "davidpazuellosa@gmail.com", label: "Celular", role: "App (gerente)", view: "app" },
] as const;

export const DEV_EMAILS: readonly string[] = DEV_ACCOUNTS.map((a) => a.email);
