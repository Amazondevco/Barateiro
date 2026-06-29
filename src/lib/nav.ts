import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  BarChart3,
  Receipt,
  LifeBuoy,
  Settings,
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

const ALL: Papel[] = ["super_admin", "admin_supermercado", "gerente"];

export const NAV: NavItem[] = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard, roles: ALL },
  {
    href: "/clientes",
    label: "Clientes (Redes)",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    href: "/formularios",
    label: "Formulários",
    icon: ClipboardList,
    roles: ["admin_supermercado", "gerente"], // página da rede, não da plataforma
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    roles: ["super_admin"], // admin gerencia em Configurações
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    roles: ["super_admin", "admin_supermercado"],
  },
  {
    href: "/faturamento",
    label: "Faturamento",
    icon: Receipt,
    roles: ["super_admin"], // admin não vê faturamento
  },
  {
    href: "/sugestoes",
    label: "Sugestões",
    icon: Lightbulb,
    roles: ["super_admin", "admin_supermercado"],
  },
  {
    href: "/suporte",
    label: "Suporte",
    icon: LifeBuoy,
    roles: ALL,
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    roles: ["super_admin", "admin_supermercado"],
  },
];
