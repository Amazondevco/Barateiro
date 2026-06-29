import { redirect } from "next/navigation";

// Aposentado: a configuração do app da rede vive em Configurações → Aplicativo.
export default function AplicativosPage() {
  redirect("/configuracoes?tab=aplicativo");
}
