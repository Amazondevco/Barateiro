import { redirect } from "next/navigation";
import { ChartColumn } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import {
  carregarBase,
  computar,
  type RelatorioRow,
} from "@/lib/relatorios";
import { AdminSubHeader } from "../../ui";
import { RelatoriosFiltros } from "../relatorios-filtros";
import { RelatorioCard } from "../relatorio-card";

export const metadata = { title: "Relatórios — Check.AI" };

export default async function AdminRelatorioChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ unidade?: string; dep?: string }>;
}) {
  const { formId } = await params;
  const sp = await searchParams;
  const unidade = typeof sp.unidade === "string" ? sp.unidade : "";
  const dep = typeof sp.dep === "string" ? sp.dep : "";

  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const [{ data: form }, { data: rels }, { data: unidades }, { data: deptos }] =
    await Promise.all([
      supabase.from("formularios").select("id,nome").eq("id", formId).maybeSingle(),
      supabase
        .from("relatorios")
        .select("id,titulo,kind,spec,ordem,origem")
        .eq("formulario_id", formId)
        .order("ordem"),
      supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
      supabase
        .from("departamentos")
        .select("id,nome")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
    ]);
  if (!form) redirect("/app/admin/relatorios");

  // Departamento → autores (usuario_id das respostas). Admin client escopado ao
  // dep, que já foi validado como da rede pela RLS acima.
  let usuarioIds: string[] | undefined;
  if (dep) {
    const admin = createAdminClient();
    const [{ data: profs }, { data: membros }] = await Promise.all([
      admin.from("profiles").select("id").eq("departamento_id", dep),
      admin.from("rede_membros").select("identidade_id").eq("departamento_id", dep),
    ]);
    usuarioIds = [
      ...((profs ?? []) as { id: string }[]).map((p) => p.id),
      ...((membros ?? []) as { identidade_id: string }[]).map((m) => m.identidade_id),
    ];
  }

  const base = await carregarBase(supabase, formId, redeId, undefined, {
    unidadeId: unidade || undefined,
    usuarioIds,
  });

  const relatorios = (rels ?? []) as RelatorioRow[];
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));
  const deptoOpts = (deptos ?? []).map((d) => ({ id: d.id, nome: d.nome }));

  return (
    <div>
      <AdminSubHeader title={form.nome} back="/app/admin/relatorios" />
      <div className="space-y-3 p-4">
        <RelatoriosFiltros
          unidades={unidadeOpts}
          departamentos={deptoOpts}
          unidade={unidade}
          dep={dep}
        />

        {relatorios.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ChartColumn className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhum relatório configurado para este checklist. Configure no painel
              (aba Painel do checklist).
            </p>
          </div>
        ) : (
          relatorios.map((r) => (
            <RelatorioCard
              key={r.id}
              titulo={r.titulo}
              computed={computar(r.kind, r.spec, base)}
            />
          ))
        )}
      </div>
    </div>
  );
}
