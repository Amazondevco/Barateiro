import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  ChartColumn,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { getRedeMarcaById } from "@/lib/rede-branding";

export const metadata = { title: "Console — Check.AI" };

const SECOES: {
  href: string;
  icon: LucideIcon;
  titulo: string;
  desc: string;
}[] = [
  {
    href: "/app/admin/gestao",
    icon: Building2,
    titulo: "Gestão",
    desc: "Unidades, departamentos, usuários e permissões",
  },
  {
    href: "/app/admin/preenchidos",
    icon: ClipboardCheck,
    titulo: "Checklists preenchidos",
    desc: "Acompanhe as respostas enviadas pela equipe",
  },
  {
    href: "/app/admin/relatorios",
    icon: ChartColumn,
    titulo: "Relatórios",
    desc: "Conformidade por unidade e departamento",
  },
];

export default async function AdminAppHome() {
  const profile = await getSessionProfile();
  const marca = profile?.rede_id ? await getRedeMarcaById(profile.rede_id) : null;

  return (
    <div>
      {/* Cabeçalho com a marca da rede */}
      <header className="bg-gradient-to-br from-primary to-primary-hover px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center gap-3">
          {marca?.logo_url ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={marca.logo_url}
                alt=""
                className="h-full w-full object-contain"
              />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">
              {marca?.nome ?? "Sua rede"}
            </p>
            <p className="text-sm opacity-80">Console do gestor</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-5">
        {SECOES.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
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
