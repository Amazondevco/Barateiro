import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IconeEditor } from "../../icone-editor";
import { carregarOpcoes } from "../../icone-data";
import type { AppIcone } from "../../icone-types";

export default async function EditarIconePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" || !profile.rede_id) redirect("/");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("app_icones")
    .select("id, nome, nome_curto, cor, cargos, unidades, departamentos")
    .eq("id", id)
    .single();
  if (!row) notFound();

  const icone: AppIcone = {
    id: row.id,
    nome: row.nome,
    nomeCurto: row.nome_curto,
    cor: row.cor,
    cargos: row.cargos ?? [],
    unidades: row.unidades ?? [],
    departamentos: row.departamentos ?? [],
  };

  const opcoes = await carregarOpcoes(supabase, profile.rede_id);

  return (
    <div className="space-y-6">
      <PageHeader title={icone.nome} crumb={icone.nome} />
      <IconeEditor icone={icone} {...opcoes} />
    </div>
  );
}
