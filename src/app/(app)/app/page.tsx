import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Clock, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { UserSwitcher } from "@/components/user-switcher";
import { DEV_EMAILS } from "@/lib/dev-accounts";

export const metadata = { title: "Meu app — Barateiro" };

type Membro = {
  id: string;
  status: string;
  cargo_id: string | null;
  unidade_id: string | null;
  departamento_id: string | null;
  rede_id: string;
  redes: { nome: string } | null;
};
type Icone = {
  id: string;
  nome: string;
  nome_curto: string;
  cor: string;
  cargos: string[];
  unidades: string[];
  departamentos: string[];
  rede_id: string;
};

// vazio numa dimensão = todos
function dimOk(id: string | null, filtro: string[]) {
  return filtro.length === 0 || (id !== null && filtro.includes(id));
}
function casa(m: Membro, ic: Icone) {
  return (
    dimOk(m.cargo_id, ic.cargos) &&
    dimOk(m.unidade_id, ic.unidades) &&
    dimOk(m.departamento_id, ic.departamentos)
  );
}

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
    .select("id, status, cargo_id, unidade_id, departamento_id, rede_id, redes(nome)")
    .order("created_at", { ascending: false });
  const membros = (membrosRaw ?? []) as unknown as Membro[];
  const ativos = membros.filter((m) => m.status === "ativo");
  const pendentes = membros.filter((m) => m.status === "pendente");

  // ícones das redes onde a pessoa é membro ativo
  const redeIds = [...new Set(ativos.map((m) => m.rede_id))];
  let icones: Icone[] = [];
  if (redeIds.length) {
    const { data } = await supabase
      .from("app_icones")
      .select("id, nome, nome_curto, cor, cargos, unidades, departamentos, rede_id")
      .in("rede_id", redeIds);
    icones = (data ?? []) as Icone[];
  }

  // monta os "apps" visíveis: ícones que casam; se a rede não tem ícone que casa,
  // mostra a rede como app genérico (fallback).
  type AppCard = { membroId: string; nome: string; cor: string; rede: string };
  const apps: AppCard[] = [];
  for (const m of ativos) {
    const seus = icones.filter((ic) => ic.rede_id === m.rede_id && casa(m, ic));
    if (seus.length) {
      for (const ic of seus) {
        apps.push({ membroId: m.id, nome: ic.nome_curto, cor: ic.cor, rede: m.redes?.nome ?? "" });
      }
    } else {
      apps.push({ membroId: m.id, nome: m.redes?.nome ?? "Rede", cor: "#6B7280", rede: m.redes?.nome ?? "" });
    }
  }

  const iniciais =
    (ident?.nome ?? "").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

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
            <p className="text-xs text-muted-foreground">Meus apps</p>
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

      <div className="flex-1 p-4">
        {apps.length === 0 && pendentes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Você ainda não tem nenhum app</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que o gestor cadastrar seu CPF na equipe, seus apps aparecem aqui.
            </p>
          </div>
        ) : (
          <>
            {apps.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {apps.map((a, i) => {
                  const ini = a.nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  return (
                    <Link key={`${a.membroId}-${i}`} href={`/app/rede/${a.membroId}`} className="flex flex-col items-center gap-1.5">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[18px] text-lg font-semibold text-white shadow-sm transition-transform active:scale-95" style={{ backgroundColor: a.cor }}>
                        {ini}
                      </div>
                      <span className="line-clamp-2 text-center text-xs text-foreground">{a.nome}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {pendentes.length > 0 && (
              <div className="mt-5 space-y-2">
                {pendentes.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-bg p-3">
                    <Clock className="h-5 w-5 text-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-warning">{m.redes?.nome}</p>
                      <p className="text-xs text-warning/80">Aguardando aprovação</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
