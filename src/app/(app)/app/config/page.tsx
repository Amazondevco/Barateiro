import Link from "next/link";
import { User, FileText, ShieldCheck, Info, ChevronRight, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddToHome } from "@/components/add-to-home";
import { signOut } from "@/lib/auth-actions";

export const metadata = { title: "Configurações — Check.AI" };

export default function ConfigPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <h1 className="text-lg font-semibold">Configurações</h1>

      {/* Instalar (some quando já instalado) */}
      <AddToHome compact />

      {/* Aparência */}
      <section>
        <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aparência
        </p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm">Tema</span>
          <ThemeToggle />
        </div>
      </section>

      {/* Conta */}
      <section>
        <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conta
        </p>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <LinhaLink href="/app/perfil" icon={User} label="Meus dados" />
          <LinhaLink href="/app/formularios" icon={FileText} label="Formulários enviados" />
        </div>
      </section>

      {/* Sobre */}
      <section>
        <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sobre
        </p>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <LinhaLink href="/termo" icon={ShieldCheck} label="Termo de privacidade" externo />
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" /> Versão
            </span>
            <span className="text-muted-foreground">Check.AI · 1.0</span>
          </div>
        </div>
      </section>

      <form action={signOut} className="mt-1">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </form>
    </div>
  );
}

function LinhaLink({
  href,
  icon: Icon,
  label,
  externo,
}: {
  href: string;
  icon: typeof User;
  label: string;
  externo?: boolean;
}) {
  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
