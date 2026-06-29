import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import {
  applyPrimaryColor,
  fetchNetworkHome,
  type NetworkHomeData,
} from "../lib/operator-api";
import { isLightHex } from "../lib/utils";
import { LoadingScreen } from "../ui/loading-screen";
import { FormsBoard } from "../ui/forms-board";

export function NetworkHomePage() {
  const { memberId = "" } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NetworkHomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !memberId) return;

    let mounted = true;

    function apply(next: NetworkHomeData) {
      if (!mounted) return;
      setData(next);
      applyPrimaryColor(next.brand.primaryColor);
    }

    async function load() {
      try {
        // Cache-first: resolve na hora se houver cache; revalida em 2º plano.
        const nextData = await fetchNetworkHome(memberId, user.id, apply);
        apply(nextData);
      } catch (loadError) {
        if (mounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Falha ao carregar a rede.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [memberId, user?.id]);

  if (loading) {
    return <LoadingScreen label="Carregando a home da rede…" />;
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-md p-4">
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Não foi possível carregar a rede."}
        </p>
      </div>
    );
  }

  const cor = data.brand.primaryColor || "#0f172a";
  const textoCor = isLightHex(cor) ? "#0f172a" : "#ffffff";
  const subtitulo =
    [data.membership.unidadeNome, data.membership.cargoNome]
      .filter(Boolean)
      .join(" · ") || "Operador";

  return (
    <div className="flex flex-1 flex-col">
      {/* Banner da REDE: cor sólida do Admin + logo + nome centralizados */}
      <div
        className="relative px-5 pb-4 pt-3 shadow-sm ring-1 ring-black/5"
        style={{ background: cor, color: textoCor }}
      >
        <div className="flex flex-col items-center gap-1.5">
          {data.brand.logoUrl ? (
            <img
              src={data.brand.logoUrl}
              alt={data.brand.nome}
              className="h-14 w-14 rounded-2xl bg-white object-contain p-1 shadow-md"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Store className="h-7 w-7" />
            </span>
          )}
          <p className="text-xl font-bold tracking-tight">{data.brand.nome}</p>
          <p className="text-xs opacity-80">{subtitulo}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 space-y-3 p-4">
        {error ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <FormsBoard membroId={memberId} forms={data.forms} />
      </div>
    </div>
  );
}
