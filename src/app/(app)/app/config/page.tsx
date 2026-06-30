import Link from "next/link";
import { User, FileText, ShieldCheck, Info, ChevronRight, LogOut } from "lucide-react";
import { ThemeGrid } from "@/components/theme-grid";
import { OpDiagnostics } from "@/components/op-diagnostics";
import { AddToHome } from "@/components/add-to-home";
import { signOut } from "@/lib/auth-actions";

export const metadata = { title: "Configurações — Check.AI" };

export default function ConfigPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-7 px-5 py-6">
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Configurações</h1>

      {/* Instalar (some quando já instalado) */}
      <AddToHome compact />

      {/* Aparência */}
      <Secao titulo="Aparência">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ThemeGrid />
        </div>
      </Secao>

      {/* Diagnóstico Operacional — só leitura */}
      <Secao titulo="Diagnóstico Operacional">
        <OpDiagnostics />
      </Secao>

      {/* Conta */}
      <Secao titulo="Conta">
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <LinhaLink href="/app/perfil" icon={User} label="Meus dados" />
          <LinhaLink href="/app/formularios" icon={FileText} label="Checklists enviados" />
        </div>
      </Secao>

      {/* Sobre */}
      <Secao titulo="Sobre">
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <LinhaLink href="/termo" icon={ShieldCheck} label="Termo de privacidade" externo />
          <div className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Info className="h-4 w-4" />
              </span>
              Versão
            </span>
            <span className="text-muted-foreground">Check.AI · 1.0</span>
          </div>
        </div>
      </Secao>

      {/* Sair da conta — mantém o handler existente */}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl border border-danger/20 bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-danger-bg/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-bg text-danger">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-danger">Sair da conta</span>
          <ChevronRight className="h-5 w-5 text-danger/40" />
        </button>
      </form>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h2>
      {children}
    </section>
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
      className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
