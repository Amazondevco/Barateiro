import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IconeEditor } from "../../icone-editor";
import { carregarOpcoes } from "../../icone-data";

export const metadata = { title: "Novo ícone — Check.AI" };

export default async function NovoIconePage() {
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" || !profile.rede_id) redirect("/");

  const supabase = await createClient();
  const opcoes = await carregarOpcoes(supabase, profile.rede_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo ícone" crumb="Novo ícone" />
      <IconeEditor icone={null} {...opcoes} />
    </div>
  );
}
