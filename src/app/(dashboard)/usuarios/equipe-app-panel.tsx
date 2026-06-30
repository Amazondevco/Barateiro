import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import type { createClient } from "@/lib/supabase/server";
import { AddRosterForm } from "../configuracoes/add-roster-form";
import { ImportRosterForm } from "../configuracoes/import-roster-form";
import { RosterRow } from "../configuracoes/roster-row";
import { addRosterPessoa, importarRoster } from "../configuracoes/roster-actions";

type SB = Awaited<ReturnType<typeof createClient>>;

function fmtCpf(cpf: string) {
  const d = (cpf ?? "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : cpf;
}

// Equipe do app (roster): quem pode usar o app da rede. Antes era uma aba em
// Configurações; agora vive na aba "Aplicativo" da página Usuários.
export async function EquipeAppPanel({
  supabase,
  redeId,
}: {
  supabase: SB;
  redeId: string;
}) {
  const [{ data: roster }, { data: unidades }, { data: cargos }, { data: deptos }] =
    await Promise.all([
      supabase
        .from("rede_roster")
        .select(
          "id, nome, cpf, status, created_by, cargo_id, unidade_id, departamento_id, cargos(nome), unidades(nome), departamentos(nome)",
        )
        .eq("rede_id", redeId)
        .order("nome"),
      supabase.from("unidades").select("id,nome").eq("rede_id", redeId).eq("status", "ativo").order("nome"),
      supabase.from("cargos").select("id,nome").eq("rede_id", redeId).order("nome"),
      supabase.from("departamentos").select("id,nome").eq("rede_id", redeId).eq("status", "ativo").order("nome"),
    ]);

  type Row = {
    id: string;
    nome: string;
    cpf: string;
    status: string;
    created_by: string | null;
    cargo_id: string | null;
    unidade_id: string | null;
    departamento_id: string | null;
    cargos: { nome: string } | null;
    unidades: { nome: string } | null;
    departamentos: { nome: string } | null;
  };
  const lista = (roster ?? []) as unknown as Row[];

  // Linhas "fixas/padrão" da Check.AI: sem criador (semeadas na criação da rede)
  // ou criadas por um super_admin. Essas não podem ser editadas/apagadas.
  const criadorIds = [...new Set(lista.map((p) => p.created_by).filter(Boolean))] as string[];
  const superSet = new Set<string>();
  if (criadorIds.length) {
    const { data: criadores } = await supabase
      .from("profiles")
      .select("id, papel")
      .in("id", criadorIds);
    for (const c of criadores ?? [])
      if (c.papel === "super_admin") superSet.add(c.id as string);
  }
  const ehProtegido = (p: Row) => !p.created_by || superSet.has(p.created_by);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Lista de quem pode usar o app. A pessoa entra automaticamente ao se
        cadastrar com o CPF cadastrado aqui, já com unidade, cargo e departamento.
      </p>
      <div className="flex justify-end gap-2">
        <ImportRosterForm action={importarRoster} />
        <AddRosterForm
          action={addRosterPessoa}
          unidades={unidades ?? []}
          cargos={cargos ?? []}
          departamentos={deptos ?? []}
        />
      </div>
      {lista.length === 0 ? (
        <EmptyState
          title="Equipe vazia"
          description="Adicione as pessoas (por CPF) que vão usar o app."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>CPF</TH>
              <TH>Cargo</TH>
              <TH>Unidade</TH>
              <TH>Departamento</TH>
              <TH>Status</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <tbody>
            {lista.map((p) => (
              <RosterRow
                key={p.id}
                pessoa={{
                  id: p.id,
                  nome: p.nome,
                  cpfFmt: fmtCpf(p.cpf),
                  status: p.status,
                  cargo_id: p.cargo_id,
                  unidade_id: p.unidade_id,
                  departamento_id: p.departamento_id,
                  cargoNome: p.cargos?.nome ?? null,
                  unidadeNome: p.unidades?.nome ?? null,
                  deptNome: p.departamentos?.nome ?? null,
                  protegido: ehProtegido(p),
                }}
                unidades={unidades ?? []}
                cargos={cargos ?? []}
                departamentos={deptos ?? []}
              />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
