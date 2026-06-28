import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { setFormularioStatus } from "./actions";

export const metadata = { title: "Formulários — Amazon Dev & Co." };

const TABS = [
  { key: "modelos", label: "Modelos" },
  { key: "respostas", label: "Respostas" },
];

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab ?? "modelos";
  const { profile } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;
  const supabase = await createClient();

  return (
    <>
      <PageHeader
        title="Formulários"
        subtitle="Modelos de checklist e respostas recebidas."
        action={
          tab === "modelos" && redeId ? (
            <Link href="/formularios/novo">
              <Button>
                <Plus className="h-4 w-4" /> Novo formulário
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/formularios?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!redeId ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Os formulários são por rede. Acesse como admin de uma rede para
            gerenciá-los.
          </CardContent>
        </Card>
      ) : tab === "modelos" ? (
        <ModelosTab supabase={supabase} redeId={redeId} />
      ) : (
        <RespostasTab supabase={supabase} redeId={redeId} />
      )}
    </>
  );
}

type SB = Awaited<ReturnType<typeof createClient>>;

async function ModelosTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: forms } = await supabase
    .from("formularios")
    .select(
      "id,nome,tipo_unidade,status,formulario_secoes(count),formulario_departamentos(count)",
    )
    .eq("rede_id", redeId)
    .order("created_at", { ascending: false });

  if ((forms ?? []).length === 0) {
    return (
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
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Formulário</TH>
          <TH>Seções</TH>
          <TH>Departamentos</TH>
          <TH>Status</TH>
          <TH className="w-40" />
        </TR>
      </THead>
      <tbody>
        {(forms ?? []).map((f) => {
          const secoes = (f.formulario_secoes as { count: number }[])?.[0]?.count ?? 0;
          const deps =
            (f.formulario_departamentos as { count: number }[])?.[0]?.count ?? 0;
          return (
            <TR key={f.id}>
              <TD>
                <Link
                  href={`/formularios/${f.id}`}
                  className="flex items-center gap-2 font-medium hover:text-primary"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {f.nome}
                </Link>
              </TD>
              <TD>{secoes}</TD>
              <TD>{deps}</TD>
              <TD>
                <Badge tone={f.status === "ativo" ? "success" : "neutral"}>
                  {f.status}
                </Badge>
              </TD>
              <TD>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/formularios/${f.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <form
                    action={setFormularioStatus.bind(
                      null,
                      f.id,
                      f.status === "ativo" ? "inativo" : "ativo",
                    )}
                  >
                    <button
                      type="submit"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {f.status === "ativo" ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </div>
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}

async function RespostasTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: respostas } = await supabase
    .from("respostas")
    .select(
      "id,data_referencia,status,total_nao,enviado_em,formularios(nome),unidades(nome),profiles(nome)",
    )
    .eq("rede_id", redeId)
    .order("enviado_em", { ascending: false })
    .limit(100);

  if ((respostas ?? []).length === 0) {
    return (
      <EmptyState
        title="Nenhuma resposta ainda"
        description="Quando os gerentes enviarem os checklists, eles aparecerão aqui."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Data</TH>
          <TH>Unidade</TH>
          <TH>Formulário</TH>
          <TH>Gerente</TH>
          <TH>Não-conformidades</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <tbody>
        {(respostas ?? []).map((r) => {
          const form = r.formularios as unknown as { nome: string } | null;
          const uni = r.unidades as unknown as { nome: string } | null;
          const ger = r.profiles as unknown as { nome: string } | null;
          return (
            <TR key={r.id}>
              <TD>
                {new Date(r.data_referencia).toLocaleDateString("pt-BR")}
              </TD>
              <TD>{uni?.nome ?? "—"}</TD>
              <TD>{form?.nome ?? "—"}</TD>
              <TD>{ger?.nome ?? "—"}</TD>
              <TD>
                {r.total_nao > 0 ? (
                  <Badge tone="danger">{r.total_nao}</Badge>
                ) : (
                  <Badge tone="success">0</Badge>
                )}
              </TD>
              <TD>
                <Badge tone={r.status === "no_prazo" ? "success" : "warning"}>
                  {r.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
                </Badge>
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
