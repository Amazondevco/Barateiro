import { ChartColumn } from "lucide-react";
import { AdminEmBreve } from "../em-breve";

export const metadata = { title: "Relatórios — Check.AI" };

export default function RelatoriosAdminPage() {
  return (
    <AdminEmBreve
      icon={ChartColumn}
      titulo="Relatórios"
      desc="Conformidade por unidade e departamento — em breve nesta fase."
    />
  );
}
