import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardList, Store } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { applyPrimaryColor, fetchNetworkHome, type NetworkHomeData } from "../lib/operator-api";
import { LoadingScreen } from "../ui/loading-screen";

export function NetworkHomePage() {
  const { memberId = "" } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NetworkHomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !memberId) return;

    async function load() {
      try {
        const nextData = await fetchNetworkHome(memberId, user.id);
        setData(nextData);
        applyPrimaryColor(nextData.brand.primaryColor);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar a rede.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [memberId, user?.id]);

  if (loading) {
    return <LoadingScreen label="Carregando a home da rede…" />;
  }

  if (!data) {
    return (
      <div className="page">
        <p className="banner danger inline-banner">{error ?? "Não foi possível carregar a rede."}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="network-hero">
        <div className="network-brand">
          {data.brand.logoUrl ? (
            <img src={data.brand.logoUrl} alt={data.brand.nome} className="brand-logo" />
          ) : (
            <div className="brand-logo fallback">
              <Store size={24} />
            </div>
          )}
          <div>
            <p className="eyebrow">Minha rede</p>
            <h1>{data.brand.nome}</h1>
            <p className="network-meta">
              {[data.membership.unidadeNome, data.membership.cargoNome].filter(Boolean).join(" • ") || "Operador"}
            </p>
          </div>
        </div>
      </header>

      {error ? <p className="banner danger inline-banner">{error}</p> : null}

      <section className="card stack-md">
        <div className="queue-row">
          <div>
            <h2>Formulários do dia</h2>
            <p className="section-copy">Primeiro fluxo da Fase 1 portado para acesso cliente direto.</p>
          </div>
          <Link to="/app/formularios/teste-offline" className="secondary-button inline-link">
            Teste offline
          </Link>
        </div>

        {data.forms.length === 0 ? (
          <div className="empty-state">Nenhum formulário disponível para o contexto atual.</div>
        ) : (
          data.forms.map((form) => (
            <article key={form.id} className="form-card">
              <div className="form-card-icon">
                <ClipboardList size={18} />
              </div>
              <div className="membership-copy">
                <strong>{form.nome}</strong>
                <span>{form.descricao ?? "Checklist configurado para esta unidade."}</span>
              </div>
              {form.enviadoHoje ? (
                <span className="success-tag">
                  <CheckCircle2 size={14} />
                  Enviado hoje
                </span>
              ) : (
                <Link to={`/app/rede/${memberId}/form/${form.id}`} className="icon-button compact-icon">
                  <ChevronRight size={18} className="muted-icon" />
                </Link>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
