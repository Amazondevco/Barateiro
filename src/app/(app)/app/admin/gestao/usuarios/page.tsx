import { Users } from "lucide-react";
import { AdminEmBreve } from "../../em-breve";

export const metadata = { title: "Usuários e permissões — Check.AI" };

export default function GestaoUsuariosPage() {
  return (
    <AdminEmBreve
      icon={Users}
      titulo="Usuários e permissões"
      desc="Equipe do app, acessos do sistema e cargos — em breve nesta fase."
    />
  );
}
