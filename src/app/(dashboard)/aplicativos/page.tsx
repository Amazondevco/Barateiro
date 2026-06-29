import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IconeSection } from "./icone-section";
import type { AppIcone } from "./icone-types";

export const metadata = { title: "Aplicativos — Barateiro" };

export default async function AplicativosPage() {
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" || !profile.rede_id) redirect("/");

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_icones")
    .select("id, nome, nome_curto, cor, cargos, unidades, departamentos")
    .eq("rede_id", profile.rede_id)
    .order("created_at");

  const icones: AppIcone[] = (rows ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    nomeCurto: r.nome_curto,
    cor: r.cor,
    cargos: r.cargos ?? [],
    unidades: r.unidades ?? [],
    departamentos: r.departamentos ?? [],
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Aplicativos" crumb="Aplicativos" />
      <IconeSection icones={icones} />
    </div>
  );
}
