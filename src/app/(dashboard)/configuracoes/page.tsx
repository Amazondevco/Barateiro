import Link from "next/link";
import {
  Box,
  Shield,
  FileText,
  Palette,
  SlidersHorizontal,
  FolderTree,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PillTabs } from "@/components/ui/pill-tabs";
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
import { AplicativoForm } from "./aplicativo-form";

export const metadata = { title: "Configurações — Check.AI" };

// Unidades, Departamentos e Usuários viraram páginas próprias (Gestão de Rede).
const TABS: { key: string; label: string; adminOnly: boolean; icon: LucideIcon }[] = [
  { key: "aplicativo", label: "Aplicativo", adminOnly: true, icon: Box },
  { key: "permissoes", label: "Permissões", adminOnly: false, icon: Shield },
  { key: "auditoria", label: "Auditoria", adminOnly: true, icon: FileText },
  { key: "aparencia", label: "Aparência", adminOnly: true, icon: Palette },
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
    const PLAT_TABS: { key: string; label: string; icon: LucideIcon }[] = [
      { key: "aparencia", label: "Aparência", icon: Palette },
      { key: "padroes", label: "Padrões gerais", icon: SlidersHorizontal },
      { key: "departamentos", label: "Departamentos", icon: FolderTree },
      { key: "unidades", label: "Unidades", icon: Store },
      { key: "usuarios", label: "Usuários", icon: Users },
      { key: "permissoes", label: "Permissões", icon: Shield },
      { key: "aplicativo", label: "Aplicativo", icon: Box },
      { key: "auditoria", label: "Auditoria", icon: FileText },
    ];
    const ptab = PLAT_TABS.some((t) => t.key === tab) ? tab : "aparencia";

    return (
      <>
        <PageHeader
          title="Configurações"
          subtitle="Plataforma — Check.AI"
        />
        <PillTabs
          className="mb-6"
          tabs={PLAT_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            icon: t.icon,
            href: `/configuracoes?tab=${t.key}`,
            active: ptab === t.key,
          }))}
        />

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

      {/* Abas (controle segmentado) */}
      <PillTabs
        className="mb-6"
        tabs={visibleTabs.map((t) => ({
          key: t.key,
          label: t.label,
          icon: t.icon,
          href: `/configuracoes?tab=${t.key}`,
          active: activeTab === t.key,
        }))}
      />

      {!redeId ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Estas configurações são por rede. Como Super Admin, gerencie cada
            rede em <Link href="/clientes" className="text-primary">Clientes</Link>.
          </CardContent>
        </Card>
      ) : (
        <>
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
