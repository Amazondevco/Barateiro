import { ClipboardCheck } from "lucide-react";
import { AdminEmBreve } from "../em-breve";

export const metadata = { title: "Checklists preenchidos — Check.AI" };

export default function PreenchidosPage() {
  return (
    <AdminEmBreve
      icon={ClipboardCheck}
      titulo="Checklists preenchidos"
      desc="As respostas enviadas pela equipe aparecem aqui — em breve nesta fase."
    />
  );
}
