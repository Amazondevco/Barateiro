import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { updateAparencia } from "./actions";
import { updateAparenciaPlataforma } from "./plataforma-actions";
import { AparenciaForm } from "./aparencia-form";
import { PadroesForm } from "./padroes-form";
import { ApkInstallerCard } from "./apk-installer-card";
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
import { RosterRow } from "./roster-row";
import { addRosterPessoa, importarRoster } from "./roster-actions";
import { AplicativoForm } from "./aplicativo-form";

export const metadata = { title: "Configurações — Check.AI" };

// Unidades, Departamentos e Usuários viraram páginas próprias (Gestão de Rede).
const TABS = [
  { key: "equipe", label: "Equipe do app", adminOnly: true },
  { key: "aplicativo", label: "Aplicativo", adminOnly: true },
  { key: "permissoes", label: "Permissões", adminOnly: false },
  { key: "auditoria", label: "Auditoria", adminOnly: true },
  { key: "aparencia", label: "Aparência", adminOnly: true },
];

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab ?? "unidades";
  const { profile, rede } = await getSessionContext();
  const androidApkUrl =
    process.env.ANDROID_APK_URL ??
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ??
    null;
  const androidApkVersion =
    process.env.ANDROID_APK_VERSION ??
    process.env.NEXT_PUBLIC_ANDROID_APK_VERSION ??
    null;
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
          <div className="space-y-4">
            <ApkInstallerCard
              apkUrl={androidApkUrl}
              apkVersion={androidApkVersion}
            />
            <AplicativoPadraoForm
              foto={plat.app_foto_obrigatoria ?? true}
              geo={plat.app_geolocalizacao ?? true}
              assinatura={plat.app_assinatura ?? false}
              offline={plat.app_offline ?? true}
              exigeCadastro={plat.app_exige_cadastro ?? true}
              aprovacaoAdmin={plat.app_aprovacao_admin ?? false}
              campos={plat.app_cadastro_campos ?? []}
            />
          </div>
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
  const activeTab = tabPermitida ? tab : (visibleTabs[0]?.key ?? "permissoes");

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
          {activeTab === "equipe" && isAdminRede && (
            <EquipeAppTab supabase={supabase} redeId={redeId} />
          )}
          {activeTab === "aplicativo" && isAdminRede && (
            <AplicativoTab supabase={supabase} redeId={redeId} />
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

async function AplicativoTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
  const { data: rede } = await supabase
    .from("redes")
    .select("app_icone_url, logo_url, app_cor, cor_primaria")
    .eq("id", redeId)
    .single();
  return (
    <AplicativoForm
      redeId={redeId}
      iconeUrl={rede?.app_icone_url ?? rede?.logo_url ?? null}
      cor={rede?.app_cor ?? rede?.cor_primaria ?? null}
    />
  );
}

async function EquipeAppTab({ supabase, redeId }: { supabase: SB; redeId: string }) {
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
