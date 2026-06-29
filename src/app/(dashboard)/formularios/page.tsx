import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { FormulariosList } from "./formularios-list";

export const metadata = { title: "Formulários — Check.AI" };

export default async function FormulariosPage() {
  const { profile } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;

  if (!redeId) {
    return (
      <>
        <PageHeader title="Formulários" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Os formulários são por rede. Acesse como admin de uma rede para
            gerenciá-los.
          </CardContent>
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const [
    { data: formsRaw },
    { data: unidades },
    { data: departamentos },
    { data: usuarios },
  ] = await Promise.all([
    supabase
      .from("formularios")
      .select(
        "id,nome,status,tipo_unidade,formulario_secoes(count),formulario_departamentos(departamento_id),formulario_usuarios(user_id)",
      )
      .eq("rede_id", redeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("unidades")
      .select("id,nome,tipo")
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

  const forms = (formsRaw ?? []).map((f) => ({
    id: f.id,
    nome: f.nome,
    status: f.status,
    tipo_unidade: f.tipo_unidade,
    secoes: (f.formulario_secoes as { count: number }[])?.[0]?.count ?? 0,
    depIds: (
      (f.formulario_departamentos as { departamento_id: string }[]) ?? []
    ).map((d) => d.departamento_id),
    userIds: (
      (f.formulario_usuarios as { user_id: string }[]) ?? []
    ).map((u) => u.user_id),
  }));

  return (
    <>
      <PageHeader title="Formulários" />
      <FormulariosList
        forms={forms}
        unidades={unidades ?? []}
        departamentos={departamentos ?? []}
        usuarios={usuarios ?? []}
      />
    </>
  );
}
