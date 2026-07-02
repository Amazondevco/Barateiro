import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { EquipeAppPanel } from "@/app/(dashboard)/usuarios/equipe-app-panel";
import { AdminSubHeader } from "../../../ui";

export const metadata = { title: "Equipe do app — Check.AI" };

export default async function AdminEquipePage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();

  return (
    <div>
      <AdminSubHeader title="Equipe do app" back="/app/admin/gestao/usuarios" />
      <div className="p-4">
        <EquipeAppPanel supabase={supabase} redeId={redeId} />
      </div>
    </div>
  );
}
