import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormBuilder } from "../form-builder";

export const metadata = { title: "Novo formulário — Check.AI" };

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
  const [{ data: unidades }, { data: deps }, { data: usuarios }] =
    await Promise.all([
      supabase
        .from("unidades")
        .select("id,nome")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
      supabase
        .from("departamentos")
        .select("id,nome,unidade_id")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
      supabase
        .from("profiles")
        .select("id,nome,departamento_id")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
    ]);

  return (
    <>
      <PageHeader title="Novo formulário" />
      <FormBuilder
        redeId={redeId}
        formId={null}
        unidades={unidades ?? []}
        departamentos={deps ?? []}
        usuarios={usuarios ?? []}
      />
    </>
  );
}
