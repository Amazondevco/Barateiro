// DEV: contas de teste para o botão de troca rápida.
// Módulo comum (sem "use server") — pode ser importado no client.
export const DEV_ACCOUNTS = [
  { email: "amazondevco@gmail.com", label: "Amazon Dev & Co.", role: "Super Admin" },
  { email: "admin@barateiro.com", label: "Dono Barateiro", role: "Admin da rede" },
] as const;
