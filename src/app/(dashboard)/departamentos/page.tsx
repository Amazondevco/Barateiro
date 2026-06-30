import { notFound } from "next/navigation";
import { Power } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { AddDepartamentoForm } from "@/app/(dashboard)/configuracoes/add-departamento-form";
import { EditDepartamentoButton } from "@/app/(dashboard)/configuracoes/edit-departamento-button";
import {
  createDepartamento,
  setDepartamentoStatus,
} from "@/app/(dashboard)/configuracoes/departamento-actions";

export const metadata = { title: "Departamentos — Check.AI" };

export default async function DepartamentosPage() {
  const { profile, rede } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;
  if (!redeId) notFound();

  const supabase = await createClient();
  const [{ data: deptos }, { data: unidades }] = await Promise.all([
    supabase
      .from("departamentos")
      .select("id,nome,escopo,status,unidade_id,unidades(nome)")
      .eq("rede_id", redeId)
      .order("nome"),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
  ]);
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <>
      <PageHeader
        title="Departamentos"
        subtitle={
          rede ? `Setores da rede — ${rede.nome}` : "Setores da sua rede (por unidade ou gerais)."
        }
        action={
          <AddDepartamentoForm
            action={createDepartamento.bind(null, redeId)}
            unidades={unidadeOpts}
          />
        }
      />
      {(deptos ?? []).length === 0 ? (
        <EmptyState
          title="Nenhum departamento"
          description="Ex.: Açougue (de uma loja) ou RH (geral da rede)."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Departamento</TH>
              <TH>Escopo</TH>
              <TH>Status</TH>
              <TH className="w-40" />
            </TR>
          </THead>
          <tbody>
            {(deptos ?? []).map((d) => {
              const uni = d.unidades as unknown as { nome: string } | null;
              return (
                <TR key={d.id}>
                  <TD className="font-medium">{d.nome}</TD>
                  <TD>
                    {d.escopo === "rede" ? "Geral da rede" : `Unidade: ${uni?.nome ?? "—"}`}
                  </TD>
                  <TD>
                    <Badge tone={d.status === "ativo" ? "success" : "neutral"}>
                      {d.status}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <EditDepartamentoButton
                        departamento={{
                          id: d.id,
                          nome: d.nome,
                          escopo: d.escopo,
                          unidade_id: d.unidade_id,
                        }}
                        unidades={unidadeOpts}
                      />
                      <Tooltip label={d.status === "ativo" ? "Desativar" : "Ativar"}>
                        <form
                          action={setDepartamentoStatus.bind(
                            null,
                            d.id,
                            d.status === "ativo" ? "inativo" : "ativo",
                          )}
                        >
                          <button className={iconBtnClass} type="submit">
                            <Power className="h-4 w-4" />
                          </button>
                        </form>
                      </Tooltip>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
