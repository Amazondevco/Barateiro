import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { PermissoesTab } from "@/app/(dashboard)/configuracoes/permissoes-tab";
import { AdminSubHeader } from "../../../ui";

export const metadata = { title: "Cargos e permissões — Check.AI" };

type Cargo = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  sistema: boolean;
  permissoes: string[];
};

export default async function AdminCargosPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("cargos")
    .select("id,nome,slug,descricao,sistema,permissoes")
    .eq("rede_id", redeId)
    .order("sistema", { ascending: false })
    .order("nome");

  const cargos = (data ?? []) as Cargo[];

  return (
    <div>
      <AdminSubHeader title="Cargos e permissões" back="/app/admin/gestao/usuarios" />
      <div className="p-4">
        <PermissoesTab redeId={redeId} cargos={cargos} />
      </div>
    </div>
  );
}
