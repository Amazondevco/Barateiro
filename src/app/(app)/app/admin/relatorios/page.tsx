import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartColumn, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { AdminSubHeader } from "../ui";

export const metadata = { title: "Relatórios — Check.AI" };

export default async function AdminRelatoriosPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("formularios")
    .select("id,nome,status")
    .eq("rede_id", redeId)
    .order("nome");

  const checklists = (data ?? []) as { id: string; nome: string; status: string }[];

  return (
    <div>
      <AdminSubHeader title="Relatórios" back="/app/admin" />
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Escolha um checklist para ver a conformidade, com filtros por unidade e
          departamento.
        </p>
        {checklists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ChartColumn className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhum checklist na rede ainda.
            </p>
          </div>
        ) : (
          checklists.map((c) => (
            <Link
              key={c.id}
              href={`/app/admin/relatorios/${c.id}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ChartColumn className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                {c.nome}
              </p>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60"
                aria-hidden="true"
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
