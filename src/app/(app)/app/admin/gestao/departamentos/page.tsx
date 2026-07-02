import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { AddDepartamentoForm } from "@/app/(dashboard)/configuracoes/add-departamento-form";
import { EditDepartamentoButton } from "@/app/(dashboard)/configuracoes/edit-departamento-button";
import {
  createDepartamento,
  setDepartamentoStatus,
} from "@/app/(dashboard)/configuracoes/departamento-actions";
import { AdminSubHeader } from "../../ui";

export const metadata = { title: "Departamentos — Check.AI" };

export default async function AdminDepartamentosPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const [{ data: deptos }, { data: unidades }] = await Promise.all([
    supabase
      .from("departamentos")
      .select("id,nome,escopo,status,unidade_id,unidades(nome)")
      .eq("rede_id", redeId)
      .order("nome"),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
  ]);

  const lista = deptos ?? [];
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <div>
      <AdminSubHeader title="Departamentos">
        <AddDepartamentoForm
          action={createDepartamento.bind(null, redeId)}
          unidades={unidadeOpts}
        />
      </AdminSubHeader>

      <div className="space-y-3 p-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhum departamento. Ex.: Açougue (de uma loja) ou RH (geral da rede).
            </p>
          </div>
        ) : (
          lista.map((d) => {
            const uni = d.unidades as unknown as { nome: string } | null;
            return (
              <div
                key={d.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{d.nome}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {d.escopo === "rede"
                        ? "Geral da rede"
                        : `Unidade: ${uni?.nome ?? "—"}`}
                    </p>
                  </div>
                  <Badge tone={d.status === "ativo" ? "success" : "neutral"}>
                    {d.status}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                  <EditDepartamentoButton
                    departamento={{
                      id: d.id,
                      nome: d.nome,
                      escopo: d.escopo,
                      unidade_id: d.unidade_id,
                    }}
                    unidades={unidadeOpts}
                  />
                  <form
                    action={setDepartamentoStatus.bind(
                      null,
                      d.id,
                      d.status === "ativo" ? "inativo" : "ativo",
                    )}
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      {d.status === "ativo" ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
