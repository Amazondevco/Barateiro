import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { AdminSubHeader } from "../ui";
import { PreenchidosList, type PreenchidoRow } from "./preenchidos-list";

export const metadata = { title: "Checklists preenchidos — Check.AI" };

export default async function AdminPreenchidosPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  // RLS entrega só as respostas da rede do admin.
  const [{ data }, { data: unidades }] = await Promise.all([
    supabase
      .from("respostas")
      .select(
        "id,data_referencia,status,total_nao,total_itens,enviado_em,unidade_id,unidades(nome),formularios(nome)",
      )
      .order("enviado_em", { ascending: false })
      .limit(200),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
  ]);

  const rows: PreenchidoRow[] = (data ?? []).map((r) => {
    const uni = r.unidades as unknown as { nome: string } | null;
    const form = r.formularios as unknown as { nome: string } | null;
    return {
      id: String(r.id),
      checklist: form?.nome ?? "Checklist",
      unidadeId: r.unidade_id ? String(r.unidade_id) : null,
      unidade: uni?.nome ?? "—",
      enviadoEm: String(r.enviado_em),
      totalNao: Number(r.total_nao ?? 0),
    };
  });

  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <div>
      <AdminSubHeader title="Checklists preenchidos" back="/app/admin" />
      <PreenchidosList rows={rows} unidades={unidadeOpts} />
    </div>
  );
}
