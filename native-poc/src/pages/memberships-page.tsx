import { useEffect, useState } from "react";
import { Building2, ChevronRight, Store, ShieldCheck, ExternalLink } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { fetchMemberships, peekMemberships, type Membership } from "../lib/operator-api";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n/i18n";
import { LoadingScreen } from "../ui/loading-screen";
import { marcarBooted } from "../lib/boot-state";

// Console do gestor é PWA (server actions + RLS). O app nativo do operador só
// abre a versão web — não reimplementa a gestão (mantém a trava no servidor).
const CONSOLE_URL = "https://check-ai-br.vercel.app/app/admin";

export function MembershipsPage() {
  const { t } = useI18n();
  const initial = peekMemberships();
  const [loading, setLoading] = useState(initial === null);
  const [memberships, setMemberships] = useState<Membership[]>(initial ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Detecta admin da rede (tem `profiles`, ao contrário do operador). Se for,
  // oferece abrir o console web.
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("papel")
        .eq("id", uid)
        .maybeSingle();
      if (mounted && (prof as { papel?: string } | null)?.papel === "admin_supermercado") {
        setIsAdmin(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Cache-first: instantâneo se já houver cache; revalida em 2º plano.
        const list = await fetchMemberships((fresh) => {
          if (mounted) setMemberships(fresh);
        });
        if (mounted) setMemberships(list);
      } catch (loadError) {
        if (mounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("Falha ao carregar vínculos."),
          );
      } finally {
        if (mounted) {
          setLoading(false);
          marcarBooted(); // vínculos carregados → fim da "abertura"
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingScreen label={t("Carregando vínculos do operador…")} />;
  }

  const activeMemberships = memberships.filter((item) => item.status === "ativo");
  const inactiveMemberships = memberships.filter(
    (item) => item.status !== "ativo",
  );

  if (activeMemberships.length === 1) {
    return <Navigate to={`/app/rede/${activeMemberships[0].id}`} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-md p-4">
      <header className="mb-5 mt-2">
        <h1 className="text-xl font-semibold">{t("Escolha uma rede")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Selecione a rede para continuar.")}
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {isAdmin ? (
        <a
          href={CONSOLE_URL}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("Console do gestor")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Gestão e acompanhamento abrem na versão web.")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      ) : null}

      {activeMemberships.length > 0 ? (
      <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
        {activeMemberships.map((item) => (
          <Link
            key={item.id}
            to={`/app/rede/${item.id}`}
            className="flex items-center gap-3 p-3 transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.redeNome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.unidadeNome ?? t("Sem unidade definida")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
      ) : null}

      {inactiveMemberships.length > 0 ? (
        <div className="mt-4 rounded-xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <strong className="text-sm">{t("Vínculos pendentes")}</strong>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("{n} vínculo(s) ainda não liberado(s) para acesso ao app.", { n: inactiveMemberships.length })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
