// Catálogo de permissões do sistema (por rede).
export type Permissao = { key: string; label: string };
export type GrupoPermissao = { grupo: string; itens: Permissao[] };

export const PERMISSOES: GrupoPermissao[] = [
  {
    grupo: "Geral",
    itens: [{ key: "dashboard.ver", label: "Ver visão geral" }],
  },
  {
    grupo: "Operação",
    itens: [
      { key: "checklist.preencher", label: "Preencher checklists" },
      { key: "formularios.gerenciar", label: "Criar e editar formulários" },
      { key: "formularios.respostas.ver", label: "Ver respostas dos checklists" },
      { key: "relatorios.ver", label: "Ver relatórios" },
    ],
  },
  {
    grupo: "Cadastros",
    itens: [
      { key: "unidades.gerenciar", label: "Gerenciar unidades" },
      { key: "departamentos.gerenciar", label: "Gerenciar departamentos" },
      { key: "usuarios.gerenciar", label: "Gerenciar usuários" },
    ],
  },
  {
    grupo: "Administração",
    itens: [
      { key: "configuracoes.gerenciar", label: "Gerenciar configurações" },
      { key: "aparencia.gerenciar", label: "Gerenciar aparência" },
      { key: "auditoria.ver", label: "Ver auditoria" },
    ],
  },
];

export const ALL_PERMISSOES = PERMISSOES.flatMap((g) =>
  g.itens.map((i) => i.key),
);

export const PERMISSAO_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSOES.flatMap((g) => g.itens.map((i) => [i.key, i.label])),
);
