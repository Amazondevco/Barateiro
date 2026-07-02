import { Building2 } from "lucide-react";
import { AdminEmBreve } from "../em-breve";

export const metadata = { title: "Gestão — Check.AI" };

export default function GestaoPage() {
  return (
    <AdminEmBreve
      icon={Building2}
      titulo="Gestão"
      desc="Unidades, departamentos, usuários e permissões — em breve nesta fase."
    />
  );
}
