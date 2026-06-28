import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RedeForm } from "../rede-form";
import { createRede } from "../actions";

export const metadata = { title: "Nova rede — Super Barateiro" };

export default function NovaRedePage() {
  return (
    <>
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <PageHeader
        title="Nova rede"
        subtitle="Cadastre um novo supermercado-cliente."
      />
      <div className="max-w-3xl">
        <RedeForm action={createRede} submitLabel="Criar rede" />
      </div>
    </>
  );
}
