import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { AddUnidadeForm } from "@/app/(dashboard)/clientes/[id]/add-unidade-form";
import { EditUnidadeButton } from "@/app/(dashboard)/clientes/[id]/edit-unidade-button";
import {
  createUnidade,
  setUnidadeStatus,
} from "@/app/(dashboard)/clientes/[id]/unidade-actions";
import { AdminSubHeader } from "../../ui";

export const metadata = { title: "Unidades — Check.AI" };

const TIPO_LABEL: Record<string, string> = {
  loja: "Loja",
  cd: "CD",
  escritorio: "Escritório",
  outro: "Outro",
};

export default async function AdminUnidadesPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select(
      "id,nome,codigo,tipo,endereco,cep,bairro,numero,complemento,cidade,uf,geo_lat,geo_lng,status",
    )
    .eq("rede_id", redeId)
    .order("nome");

  const lista = unidades ?? [];

  return (
    <div>
      <AdminSubHeader title="Unidades">
        <AddUnidadeForm action={createUnidade.bind(null, redeId)} />
      </AdminSubHeader>

      <div className="space-y-3 p-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhuma unidade ainda. Adicione lojas, CDs ou escritórios da sua rede.
            </p>
          </div>
        ) : (
          lista.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">
                    {u.nome}
                    {u.codigo ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        #{u.codigo}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {TIPO_LABEL[u.tipo] ?? u.tipo}
                    {u.cidade ? ` · ${u.cidade}${u.uf ? "/" + u.uf : ""}` : ""}
                  </p>
                </div>
                <Badge tone={u.status === "ativo" ? "success" : "neutral"}>
                  {u.status}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                <EditUnidadeButton unidade={u} redeId={redeId} />
                <form
                  action={setUnidadeStatus.bind(
                    null,
                    u.id,
                    redeId,
                    u.status === "ativo" ? "inativo" : "ativo",
                  )}
                >
                  <Button variant="ghost" size="sm" type="submit">
                    {u.status === "ativo" ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
