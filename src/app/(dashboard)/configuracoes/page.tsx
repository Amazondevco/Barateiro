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
import { Power } from "lucide-react";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { EditUnidadeButton } from "@/app/(dashboard)/clientes/[id]/edit-unidade-button";
import { EditDepartamentoButton } from "./edit-departamento-button";
import { EditUsuarioButton } from "@/components/edit-usuario-button";
import { updateAparencia } from "./actions";
import { updateAparenciaPlataforma } from "./plataforma-actions";
import { AparenciaForm } from "./aparencia-form";
import { PadroesForm } from "./padroes-form";
import {
  DepartamentosPadraoForm,
  UnidadesPadraoForm,
  UsuariosPadraoForm,
  AplicativoPadraoForm,
  PermissoesPadraoForm,
} from "./padroes-avancados";
import { PermissoesTab } from "./permissoes-tab";
import { AddRosterForm } from "./add-roster-form";
import { ImportRosterForm } from "./import-roster-form";
import { addRosterPessoa, importarRoster } from "./roster-actions";

export const metadata = { title: "Configurações — Check.AI" };

const TABS = [
  { key: "unidades", label: "Unidades", adminOnly: false },
  { key: "departamentos", label: "Departamentos", adminOnly: false },
  { key: "usuarios", label: "Usuários", adminOnly: false },
  { key: "equipe", label: "Equipe do app", adminOnly: true },
  { key: "permissoes", label: "Permissões", adminOnly: false },
  { key: "auditoria", label: "Auditoria", adminOnly: true },
  { key: "aparencia", label: "Aparência", adminOnly: true },
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

  // ---- Super Admin: configurações da PLATAFORMA ----
  if (profile?.papel === "super_admin") {
    const { data: plat } = await supabase
      .from("plataforma")
      .select("*")
      .eq("id", true)
      .single();
    const PLAT_TABS = [
      { key: "aparencia", label: "Aparência" },
      { key: "padroes", label: "Padrões gerais" },
      { key: "departamentos", label: "Departamentos" },
      { key: "unidades", label: "Unidades" },
      { key: "usuarios", label: "Usuários" },
      { key: "permissoes", label: "Permissões" },
      { key: "aplicativo", label: "Aplicativo" },
      { key: "auditoria", label: "Auditoria" },
    ];
    const ptab = PLAT_TABS.some((t) => t.key === tab) ? tab : "aparencia";

    return (
      <>
        <PageHeader
          title="Configurações"
          subtitle="Plataforma — Check.AI"
        />
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {PLAT_TABS.map((t) => (
            <Link
              key={t.key}
              href={`/configuracoes?tab=${t.key}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                ptab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {ptab === "aparencia" && plat && (
          <AparenciaForm
            action={updateAparenciaPlataforma}
            redeId="plataforma"
            logoUrl={plat.logo_url}
            faviconUrl={plat.favicon_url}
            bannerUrl={plat.banner_url}
            cor={plat.cor_primaria}
            corSidebar={plat.cor_sidebar}
            nome={plat.nome}
          />
        )}
        {ptab === "auditoria" && <AuditoriaGlobal supabase={supabase} />}
        {ptab === "padroes" && plat && (
          <PadroesForm
            horario={plat.default_horario_limite}
            dias={plat.default_dias}
            janela={plat.default_janela_edicao}
            retencao={plat.default_retencao_fotos}
          />
        )}
        {ptab === "departamentos" && plat && (
          <DepartamentosPadraoForm lista={plat.default_departamentos ?? []} />
        )}
        {ptab === "unidades" && plat && (
          <UnidadesPadraoForm tipos={plat.default_unidade_tipos ?? []} />
        )}
        {ptab === "usuarios" && plat && (
          <UsuariosPadraoForm
            papel={plat.default_papel_usuario ?? "gerente"}
            status={plat.default_status_usuario ?? "ativo"}
            limite={plat.default_limite_usuarios ?? null}
          />
        )}
        {ptab === "aplicativo" && plat && (
          <AplicativoPadraoForm
            foto={plat.app_foto_obrigatoria ?? true}
            geo={plat.app_geolocalizacao ?? true}
            assinatura={plat.app_assinatura ?? false}
            offline={plat.app_offline ?? true}
            exigeCadastro={plat.app_exige_cadastro ?? true}
            aprovacaoAdmin={plat.app_aprovacao_admin ?? false}
            campos={plat.app_cadastro_campos ?? []}
          />
        )}
        {ptab === "permissoes" && plat && (
          <PermissoesPadraoForm
            admin={plat.default_perms_admin ?? []}
            gerente={plat.default_perms_gerente ?? []}
            colaborador={plat.default_perms_colaborador ?? []}
          />
        )}
      </>
    );
  }

  // Auditoria e Aparência são exclusivas do admin da rede
  const isAdminRede = profile?.papel === "admin_supermercado";
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdminRede);
  const tabPermitida = visibleTabs.some((t) => t.key === tab);
  const activeTab = tabPermitida ? tab : "unidades";

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
        {visibleTabs.map((t) => (
          <Link
            key={t.key}
            href={`/configuracoes?tab=${t.key}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
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
          {activeTab === "unidades" && (
            <UnidadesTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "departamentos" && (
            <DepartamentosTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "usuarios" && (
            <UsuariosTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "equipe" && isAdminRede && (
            <EquipeAppTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "permissoes" && (
            <CargosTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "auditoria" && isAdminRede && (
            <AuditoriaTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "aparencia" && isAdminRede && rede && (
            <AparenciaForm
              action={updateAparencia.bind(null, redeId)}
              redeId={redeId}
              logoUrl={rede.logo_url}
              faviconUrl={rede.favicon_url}
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

function fmtCpf(cpf: string) {
  const d = (cpf ?? "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : cpf;
}

async function EquipeAppTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const [{ data: roster }, { data: unidades }, { data: cargos }, { data: deptos }] =
    await Promise.all([
      supabase
        .from("rede_roster")
        .select(
          "id, nome, cpf, status, cargos(nome), unidades(nome), departamentos(nome)",
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
    cargos: { nome: string } | null;
    unidades: { nome: string } | null;
    departamentos: { nome: string } | null;
  };
  const lista = (roster ?? []) as unknown as Row[];

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
            </TR>
          </THead>
          <tbody>
            {lista.map((p) => (
              <TR key={p.id}>
                <TD><span className="font-medium">{p.nome}</span></TD>
                <TD>{fmtCpf(p.cpf)}</TD>
                <TD>{p.cargos?.nome ?? "—"}</TD>
                <TD>{p.unidades?.nome ?? "—"}</TD>
                <TD>{p.departamentos?.nome ?? "—"}</TD>
                <TD>
                  <Badge tone={p.status === "vinculado" ? "success" : "warning"}>
                    {p.status === "vinculado" ? "Cadastrado" : "Aguardando"}
                  </Badge>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

async function UnidadesTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id,nome,codigo,tipo,endereco,cidade,uf,geo_lat,geo_lng,status")
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
              <TH className="w-40" />
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
                  <div className="flex items-center gap-1">
                    <EditUnidadeButton unidade={u} redeId={redeId} />
                    <Tooltip label={u.status === "ativo" ? "Desativar" : "Ativar"}>
                      <form action={setUnidadeStatus.bind(null, u.id, redeId, u.status === "ativo" ? "inativo" : "ativo")}>
                        <button className={iconBtnClass} type="submit">
                          <Power className="h-4 w-4" />
                        </button>
                      </form>
                    </Tooltip>
                  </div>
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
      .select("id,nome,escopo,status,unidade_id,unidades(nome)")
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
              <TH className="w-40" />
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
                    <div className="flex items-center gap-1">
                      <EditDepartamentoButton
                        departamento={{
                          id: d.id,
                          nome: d.nome,
                          escopo: d.escopo,
                          unidade_id: d.unidade_id,
                        }}
                        unidades={unidadeOpts}
                      />
                      <Tooltip label={d.status === "ativo" ? "Desativar" : "Ativar"}>
                        <form action={setDepartamentoStatus.bind(null, d.id, d.status === "ativo" ? "inativo" : "ativo")}>
                          <button className={iconBtnClass} type="submit">
                            <Power className="h-4 w-4" />
                          </button>
                        </form>
                      </Tooltip>
                    </div>
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
  const [{ data: usuarios }, { data: unidades }, { data: departamentos }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,nome,email,papel,status,departamento_id,departamentos(nome)")
        .eq("rede_id", redeId)
        .order("nome"),
      supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
      supabase
        .from("departamentos")
        .select("id,nome")
        .eq("rede_id", redeId)
        .eq("status", "ativo")
        .order("nome"),
    ]);
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));
  const deptoOpts = (departamentos ?? []).map((d) => ({ id: d.id, nome: d.nome }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUsuarioForm
          action={createUsuario}
          redeId={redeId}
          unidades={unidadeOpts}
          departamentos={deptoOpts}
        />
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
              <TH>Departamento</TH>
              <TH>Status</TH>
              <TH className="w-20" />
            </TR>
          </THead>
          <tbody>
            {(usuarios ?? []).map((u) => {
              const depto = u.departamentos as unknown as { nome: string } | null;
              return (
                <TR key={u.id}>
                  <TD className="font-medium">{u.nome || "—"}</TD>
                  <TD>{u.email}</TD>
                  <TD>{PAPEL_LABEL[u.papel as Papel]}</TD>
                  <TD>{depto?.nome ?? "—"}</TD>
                  <TD>
                    <Badge tone={u.status === "ativo" ? "success" : "neutral"}>{u.status}</Badge>
                  </TD>
                  <TD>
                    <EditUsuarioButton
                      usuario={{
                        id: u.id,
                        nome: u.nome,
                        email: u.email,
                        papel: u.papel,
                        status: u.status,
                        departamento_id:
                          (u as { departamento_id: string | null })
                            .departamento_id ?? null,
                      }}
                      departamentos={deptoOpts}
                    />
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

async function AuditoriaGlobal({ supabase }: { supabase: SB }) {
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,acao,entidade,created_at,profiles(nome),redes(nome)")
    .order("created_at", { ascending: false })
    .limit(100);

  if ((logs ?? []).length === 0) {
    return (
      <EmptyState
        title="Sem registros ainda"
        description="As ações na plataforma e nas redes aparecerão aqui."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Quando</TH>
          <TH>Rede</TH>
          <TH>Usuário</TH>
          <TH>Ação</TH>
          <TH>Entidade</TH>
        </TR>
      </THead>
      <tbody>
        {(logs ?? []).map((l) => {
          const autor = l.profiles as unknown as { nome: string } | null;
          const r = l.redes as unknown as { nome: string } | null;
          return (
            <TR key={String(l.id)}>
              <TD>{new Date(l.created_at).toLocaleString("pt-BR")}</TD>
              <TD>{r?.nome ?? "—"}</TD>
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
