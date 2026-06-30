import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  BarChart3,
  Receipt,
  Megaphone,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { Papel } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Papel[]; // papéis que enxergam o item
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const ALL: Papel[] = ["super_admin", "admin_supermercado", "gerente"];

// Navegação agrupada por seção. Configurações e Suporte saem da lista e ficam no
// rodapé (caixa do usuário). Grupos vazios para o papel atual são ocultados.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { href: "/", label: "Painel Principal", icon: LayoutDashboard, roles: ALL },
      {
        href: "/formularios",
        label: "Checklists",
        icon: ClipboardList,
        roles: ["admin_supermercado", "gerente"],
      },
    ],
  },
  {
    label: "Gestão de Rede",
    items: [
      {
        href: "/comunicados",
        label: "Comunicados",
        icon: Megaphone,
        roles: ["super_admin", "admin_supermercado"],
      },
    ],
  },
  {
    label: "Análise",
    items: [
      {
        href: "/relatorios",
        label: "Relatórios e IA",
        icon: BarChart3,
        roles: ["super_admin", "admin_supermercado"],
      },
      {
        href: "/sugestoes",
        label: "Sugestões",
        icon: Lightbulb,
        roles: ["super_admin", "admin_supermercado"],
      },
    ],
  },
  {
    label: "Plataforma",
    items: [
      {
        href: "/clientes",
        label: "Clientes (Redes)",
        icon: Building2,
        roles: ["super_admin"],
      },
      {
        href: "/usuarios",
        label: "Usuários",
        icon: Users,
        roles: ["super_admin"],
      },
      {
        href: "/faturamento",
        label: "Faturamento",
        icon: Receipt,
        roles: ["super_admin"],
      },
    ],
  },
];

// Lista achatada (compat: page-title deriva o título da rota a partir daqui).
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Grupos visíveis para um papel (remove itens e grupos vazios).
export function gruposPara(papel: Papel): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(papel)),
  })).filter((g) => g.items.length > 0);
}
