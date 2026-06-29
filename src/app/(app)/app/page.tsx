import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Clock, ChevronRight, LogOut, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { UserSwitcher } from "@/components/user-switcher";
import { DEV_EMAILS } from "@/lib/dev-accounts";

export const metadata = { title: "Meu app — Check.AI" };

type Membro = {
  id: string;
  status: string;
  redes: { nome: string } | null;
  unidades: { nome: string } | null;
};

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const c = claims?.claims as { sub?: string; email?: string } | undefined;
  const sub = c?.sub;
  if (!sub) redirect("/login");
  const email = c?.email ?? "";

  const { data: ident } = await supabase
    .from("identidades")
    .select("nome, foto_url")
    .eq("id", sub)
    .single();

  const { data: membrosRaw } = await supabase
    .from("rede_membros")
    .select("id, status, redes(nome), unidades(nome)")
    .order("created_at", { ascending: false });
  const membros = (membrosRaw ?? []) as unknown as Membro[];
  const ativos = membros.filter((m) => m.status === "ativo");
  const pendentes = membros.filter((m) => m.status === "pendente");

  // Uma unidade ativa → entra DIRETO (sem passos intermediários).
  if (ativos.length === 1) redirect(`/app/rede/${ativos[0].id}`);

  const iniciais =
    (ident?.nome ?? "")
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          {ident?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ident.foto_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {iniciais}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">{ident?.nome ?? "Bem-vindo"}</p>
            <p className="text-xs text-muted-foreground">
              {ativos.length > 1 ? "Escolha a unidade" : "Meu app"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {DEV_EMAILS.includes(email) && <UserSwitcher currentEmail={email} />}
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <div className="flex-1 space-y-3 p-4">
        {/* >1 unidade ativa → escolha rápida */}
        {ativos.map((m) => (
          <Link
            key={m.id}
            href={`/app/rede/${m.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.unidades?.nome ?? m.redes?.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{m.redes?.nome}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}

        {pendentes.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4">
            <Clock className="h-5 w-5 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-warning">
                {m.unidades?.nome ?? m.redes?.nome}
              </p>
              <p className="text-xs text-warning/80">Aguardando aprovação</p>
            </div>
          </div>
        ))}

        {ativos.length === 0 && pendentes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Você ainda não tem nenhum app</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que o gestor cadastrar seu CPF na equipe, seu app aparece aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
