import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, ChevronRight, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PendingEnviados } from "./pending-enviados";

export const metadata = { title: "Formulários enviados — Check.AI" };

export default async function EnviadosPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) redirect("/login");

  const { data: respostas } = await supabase
    .from("respostas")
    .select("id, enviado_em, total_itens, total_nao, formularios(nome), unidades(nome)")
    .eq("usuario_id", sub)
    .order("enviado_em", { ascending: false })
    .limit(100);

  type R = {
    id: string;
    enviado_em: string;
    total_itens: number;
    total_nao: number;
    formularios: { nome: string } | null;
    unidades: { nome: string } | null;
  };
  const lista = (respostas ?? []) as unknown as R[];

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="mb-3 text-lg font-semibold">Formulários enviados</h1>

      <PendingEnviados />

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nada enviado ainda</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Os checklists que você enviar aparecem aqui pra conferência.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((r) => {
            const d = new Date(r.enviado_em).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <Link
                key={r.id}
                href={`/app/formularios/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.formularios?.nome ?? "Formulário"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d}
                    {r.unidades?.nome ? ` · ${r.unidades.nome}` : ""}
                  </p>
                </div>
                {r.total_nao > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> {r.total_nao}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
