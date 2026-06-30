import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Table, THead, TH, TR, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { AddUnidadeForm } from "@/app/(dashboard)/clientes/[id]/add-unidade-form";
import { createUnidade } from "@/app/(dashboard)/clientes/[id]/unidade-actions";
import { UnidadeRow } from "@/app/(dashboard)/configuracoes/unidade-row";

export const metadata = { title: "Unidades — Check.AI" };

export default async function UnidadesPage() {
  const { profile, rede } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;
  // Página da rede (admin). Super admin gerencia unidades por cliente em /clientes.
  if (!redeId) notFound();

  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select(
      "id,nome,codigo,tipo,endereco,cep,bairro,numero,complemento,cidade,uf,geo_lat,geo_lng,status",
    )
    .eq("rede_id", redeId)
    .order("nome");

  return (
    <>
      <PageHeader
        title="Unidades"
        subtitle={
          rede ? `Lojas, CDs e escritórios — ${rede.nome}` : "Lojas, CDs e escritórios da sua rede."
        }
        action={<AddUnidadeForm action={createUnidade.bind(null, redeId)} />}
      />
      {(unidades ?? []).length === 0 ? (
        <EmptyState
          title="Nenhuma unidade"
          description="Adicione lojas, CDs ou escritórios da sua rede."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Unidade</TH>
              <TH>Tipo</TH>
              <TH>Cidade</TH>
              <TH>Status</TH>
              <TH className="w-40" />
            </TR>
          </THead>
          <tbody>
            {(unidades ?? []).map((u) => (
              <UnidadeRow key={u.id} unidade={u} redeId={redeId} />
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
