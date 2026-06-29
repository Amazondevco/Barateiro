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
    async function load() {
      try {
        setMemberships(await fetchMemberships());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar vínculos.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <LoadingScreen label="Carregando vínculos do operador…" />;
  }

  const activeMemberships = memberships.filter((item) => item.status === "ativo");
  const inactiveMemberships = memberships.filter((item) => item.status !== "ativo");

  if (activeMemberships.length === 1) {
    return <Navigate to={`/app/rede/${activeMemberships[0].id}`} replace />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Operador</p>
        <h1>Escolha uma rede para continuar</h1>
        <p className="hero-copy">Essa tela já acessa `rede_membros` direto via RLS no cliente.</p>
      </header>

      {error ? <p className="banner danger inline-banner">{error}</p> : null}

      <section className="card stack-md">
        {activeMemberships.map((item) => (
          <Link key={item.id} to={`/app/rede/${item.id}`} className="membership-card">
            <div className="membership-icon">
              <Store size={20} />
            </div>
            <div className="membership-copy">
              <strong>{item.redeNome}</strong>
              <span>{item.unidadeNome ?? "Sem unidade definida"}</span>
            </div>
            <ChevronRight size={18} />
          </Link>
        ))}

        {inactiveMemberships.length > 0 ? (
          <div className="muted-panel">
            <div className="queue-row">
              <strong>Vínculos pendentes</strong>
              <Building2 size={18} />
            </div>
            <p className="muted">
              {inactiveMemberships.length} vínculo(s) ainda não liberado(s) para acesso ao app.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
