import Link from "next/link";
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { AdminSubHeader } from "../../ui";

export const metadata = { title: "Usuários e permissões — Check.AI" };

const ITENS: {
  href: string;
  icon: LucideIcon;
  titulo: string;
  desc: string;
}[] = [
  {
    href: "/app/admin/gestao/usuarios/sistema",
    icon: Monitor,
    titulo: "Usuários do sistema",
    desc: "Admin e gerentes com acesso ao painel",
  },
  {
    href: "/app/admin/gestao/usuarios/equipe",
    icon: Smartphone,
    titulo: "Equipe do app",
    desc: "Quem usa o app (por CPF), unidade e cargo",
  },
  {
    href: "/app/admin/gestao/usuarios/cargos",
    icon: ShieldCheck,
    titulo: "Cargos e permissões",
    desc: "O que cada cargo pode fazer",
  },
];

export default function UsuariosHub() {
  return (
    <div>
      <AdminSubHeader title="Usuários e permissões" back="/app/admin/gestao" />
      <div className="space-y-3 p-4">
        {ITENS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{s.titulo}</p>
                <p className="text-[13px] text-muted-foreground">{s.desc}</p>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
