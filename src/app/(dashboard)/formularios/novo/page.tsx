import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";

export const metadata = { title: "Novo formulário — Amazon Dev & Co." };

export default async function NovoFormularioPage() {
  const { profile } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;

  if (!redeId) {
    return (
      <>
        <PageHeader title="Novo formulário" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Formulários são por rede. Acesse como admin de uma rede.
          </CardContent>
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const { data: deps } = await supabase
    .from("departamentos")
    .select("id,nome")
    .eq("rede_id", redeId)
    .eq("status", "ativo")
    .order("nome");

  return (
    <>
      <Link
        href="/formularios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Formulários
      </Link>
      <PageHeader title="Novo formulário" />
      <FormBuilder redeId={redeId} formId={null} departamentos={deps ?? []} />
    </>
  );
}
