import { useEffect, useState } from "react";
import { Building2, ChevronRight, Store } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { fetchMemberships, type Membership } from "../lib/operator-api";
import { LoadingScreen } from "../ui/loading-screen";

export function MembershipsPage() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);

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
              : "Falha ao carregar vínculos.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingScreen label="Carregando vínculos do operador…" />;
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
        <h1 className="text-xl font-semibold">Escolha uma rede</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione a rede para continuar.
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

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
                {item.unidadeNome ?? "Sem unidade definida"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {inactiveMemberships.length > 0 ? (
        <div className="mt-4 rounded-xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <strong className="text-sm">Vínculos pendentes</strong>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {inactiveMemberships.length} vínculo(s) ainda não liberado(s) para
            acesso ao app.
          </p>
        </div>
      ) : null}
    </div>
  );
}
