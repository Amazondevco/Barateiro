import Link from "next/link";
import {
  Search,
  Building2,
  Store,
  Users,
  UserCircle,
  ClipboardList,
  FolderTree,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { buscaGlobal } from "@/lib/search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Busca — Check.AI" };

const ICONES: Record<string, LucideIcon> = {
  clientes: Building2,
  usuarios: UserCircle,
  equipe: Users,
  formularios: ClipboardList,
  unidades: Store,
  departamentos: FolderTree,
};

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { groups, total } = await buscaGlobal(q, 50);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <form action="/busca" className="relative">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Buscar em todo o sistema…"
          className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {q.trim().length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Digite ao menos 2 caracteres para buscar.
        </p>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nada encontrado para “{q}”.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tente outro termo — nome de formulário, unidade, departamento,
            usuário ou cliente.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} resultado{total > 1 ? "s" : ""} para “{q}”
          </p>
          <div className="space-y-6">
            {groups.map((g) => {
              const Icon = ICONES[g.key] ?? Search;
              return (
                <section key={g.key}>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-4 w-4" /> {g.label}
                  </h2>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                    {g.hits.map((h) => (
                      <Link
                        key={g.key + h.id}
                        href={h.href}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {h.title}
                          </p>
                          {h.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">
                              {h.subtitle}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
