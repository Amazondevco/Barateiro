import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export const metadata = { title: "Formulários — Amazon Dev & Co." };

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
  const { data } = await supabase
    .from("formularios")
    .select(
      "id,nome,status,formulario_secoes(count),formulario_departamentos(count)",
    )
    .eq("rede_id", redeId)
    .order("created_at", { ascending: false });

  const forms = data ?? [];

  return (
    <>
      <PageHeader
        title="Formulários"
        action={
          <Link href="/formularios/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo formulário
            </Button>
          </Link>
        }
      />

      {forms.length === 0 ? (
        <EmptyState
          title="Nenhum formulário ainda"
          description="Crie o primeiro modelo de checklist para suas unidades."
          action={
            <Link href="/formularios/novo">
              <Button>
                <Plus className="h-4 w-4" /> Novo formulário
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => {
            const secoes =
              (f.formulario_secoes as { count: number }[])?.[0]?.count ?? 0;
            const deps =
              (f.formulario_departamentos as { count: number }[])?.[0]?.count ??
              0;
            return (
              <Link key={f.id} href={`/formularios/${f.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </span>
                      <Badge tone={f.status === "ativo" ? "success" : "neutral"}>
                        {f.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold">{f.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {secoes} {secoes === 1 ? "seção" : "seções"} ·{" "}
                        {deps === 0
                          ? "todos os deptos"
                          : `${deps} ${deps === 1 ? "depto" : "deptos"}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
