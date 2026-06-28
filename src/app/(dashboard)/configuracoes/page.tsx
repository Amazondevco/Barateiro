import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { PAPEL_LABEL, type Papel } from "@/lib/types";

import {
  createUnidade,
  setUnidadeStatus,
} from "@/app/(dashboard)/clientes/[id]/unidade-actions";
import { AddUnidadeForm } from "@/app/(dashboard)/clientes/[id]/add-unidade-form";
import { createUsuario } from "@/app/(dashboard)/usuarios/actions";
import { AddUsuarioForm } from "@/components/add-usuario-form";
import {
  createDepartamento,
  setDepartamentoStatus,
} from "./departamento-actions";
import { AddDepartamentoForm } from "./add-departamento-form";
import { updateAparencia } from "./actions";
import { AparenciaForm } from "./aparencia-form";
import { PermissoesTab } from "./permissoes-tab";

export const metadata = { title: "Configurações — Amazon Dev & Co." };

const TABS = [
  { key: "unidades", label: "Unidades" },
  { key: "departamentos", label: "Departamentos" },
  { key: "usuarios", label: "Usuários" },
  { key: "permissoes", label: "Permissões" },
  { key: "auditoria", label: "Auditoria" },
  { key: "aparencia", label: "Aparência" },
];

const TIPO_LABEL: Record<string, string> = {
  loja: "Loja",
  cd: "CD / Galpão",
  escritorio: "Escritório",
  outro: "Outro",
};

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab ?? "unidades";
  const { profile, rede } = await getSessionContext();
  const redeId = profile?.rede_id ?? null;
  const supabase = await createClient();

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle={
          rede ? `Gestão da rede ${rede.nome}` : "Preferências do sistema"
        }
      />

      {/* Abas horizontais */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/configuracoes?tab=${t.key}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
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
            Estas configurações são por rede. Como Super Admin, gerencie cada
            rede em <Link href="/clientes" className="text-primary">Clientes</Link>.
          </CardContent>
        </Card>
      ) : (
        <>
          {tab === "unidades" && (
            <UnidadesTab supabase={supabase} redeId={redeId} />
          )}
          {tab === "departamentos" && (
            <DepartamentosTab supabase={supabase} redeId={redeId} />
          )}
          {tab === "usuarios" && (
            <UsuariosTab supabase={supabase} redeId={redeId} />
          )}
          {tab === "permissoes" && (
            <CargosTab supabase={supabase} redeId={redeId} />
          )}
          {tab === "auditoria" && (
            <AuditoriaTab supabase={supabase} redeId={redeId} />
          )}
          {tab === "aparencia" && rede && (
            <AparenciaForm
              action={updateAparencia.bind(null, redeId)}
              redeId={redeId}
              logoUrl={rede.logo_url}
              bannerUrl={rede.banner_url}
              cor={rede.cor_primaria}
              corSidebar={rede.cor_sidebar}
              nome={rede.nome}
            />
          )}
        </>
      )}
    </>
  );
}

/* ---------- Tabs ---------- */

type SB = Awaited<ReturnType<typeof createClient>>;

async function UnidadesTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id,nome,codigo,tipo,cidade,uf,status")
    .eq("rede_id", redeId)
    .order("nome");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUnidadeForm action={createUnidade.bind(null, redeId)} />
      </div>
      {(unidades ?? []).length === 0 ? (
        <EmptyState title="Nenhuma unidade" description="Adicione lojas, CDs ou escritórios." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Unidade</TH>
              <TH>Tipo</TH>
              <TH>Cidade</TH>
              <TH>Status</TH>
              <TH className="w-28" />
            </TR>
          </THead>
          <tbody>
            {(unidades ?? []).map((u) => (
              <TR key={u.id}>
                <TD>
                  <span className="font-medium">{u.nome}</span>
                  {u.codigo && (
                    <span className="ml-2 text-xs text-muted-foreground">#{u.codigo}</span>
                  )}
                </TD>
                <TD>{TIPO_LABEL[u.tipo] ?? u.tipo}</TD>
                <TD>{u.cidade ? `${u.cidade}${u.uf ? "/" + u.uf : ""}` : "—"}</TD>
                <TD>
                  <Badge tone={u.status === "ativo" ? "success" : "neutral"}>{u.status}</Badge>
                </TD>
                <TD>
                  <form action={setUnidadeStatus.bind(null, u.id, redeId, u.status === "ativo" ? "inativo" : "ativo")}>
                    <button className="text-sm text-muted-foreground hover:text-foreground" type="submit">
                      {u.status === "ativo" ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

async function DepartamentosTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const [{ data: deptos }, { data: unidades }] = await Promise.all([
    supabase
      .from("departamentos")
      .select("id,nome,escopo,status,unidades(nome)")
      .eq("rede_id", redeId)
      .order("nome"),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
  ]);
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddDepartamentoForm action={createDepartamento.bind(null, redeId)} unidades={unidadeOpts} />
      </div>
      {(deptos ?? []).length === 0 ? (
        <EmptyState title="Nenhum departamento" description="Ex.: Açougue (de uma loja) ou RH (geral da rede)." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Departamento</TH>
              <TH>Escopo</TH>
              <TH>Status</TH>
              <TH className="w-28" />
            </TR>
          </THead>
          <tbody>
            {(deptos ?? []).map((d) => {
              const uni = d.unidades as unknown as { nome: string } | null;
              return (
                <TR key={d.id}>
                  <TD className="font-medium">{d.nome}</TD>
                  <TD>{d.escopo === "rede" ? "Geral da rede" : `Unidade: ${uni?.nome ?? "—"}`}</TD>
                  <TD>
                    <Badge tone={d.status === "ativo" ? "success" : "neutral"}>{d.status}</Badge>
                  </TD>
                  <TD>
                    <form action={setDepartamentoStatus.bind(null, d.id, d.status === "ativo" ? "inativo" : "ativo")}>
                      <button className="text-sm text-muted-foreground hover:text-foreground" type="submit">
                        {d.status === "ativo" ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

async function UsuariosTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const [{ data: usuarios }, { data: unidades }] = await Promise.all([
    supabase.from("profiles").select("id,nome,email,papel,status").eq("rede_id", redeId).order("nome"),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
  ]);
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUsuarioForm action={createUsuario} redeId={redeId} unidades={unidadeOpts} />
      </div>
      {(usuarios ?? []).length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Crie admins e gerentes desta rede." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>E-mail</TH>
              <TH>Papel</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {(usuarios ?? []).map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.nome || "—"}</TD>
                <TD>{u.email}</TD>
                <TD>{PAPEL_LABEL[u.papel as Papel]}</TD>
                <TD>
                  <Badge tone={u.status === "ativo" ? "success" : "neutral"}>{u.status}</Badge>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

async function CargosTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: cargos } = await supabase
    .from("cargos")
    .select("id,nome,slug,descricao,sistema,permissoes")
    .eq("rede_id", redeId)
    .order("sistema", { ascending: false })
    .order("nome");
  return <PermissoesTab redeId={redeId} cargos={cargos ?? []} />;
}

async function AuditoriaTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,acao,entidade,entidade_id,created_at,profiles(nome)")
    .eq("rede_id", redeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if ((logs ?? []).length === 0) {
    return (
      <EmptyState
        title="Sem registros ainda"
        description="As ações (criar, editar, desativar) passarão a ser registradas aqui."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Quando</TH>
          <TH>Usuário</TH>
          <TH>Ação</TH>
          <TH>Entidade</TH>
        </TR>
      </THead>
      <tbody>
        {(logs ?? []).map((l) => {
          const autor = l.profiles as unknown as { nome: string } | null;
          return (
            <TR key={String(l.id)}>
              <TD>{new Date(l.created_at).toLocaleString("pt-BR")}</TD>
              <TD>{autor?.nome ?? "—"}</TD>
              <TD>{l.acao}</TD>
              <TD>{l.entidade}</TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
