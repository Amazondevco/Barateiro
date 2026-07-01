import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import {
  applyPrimaryColor,
  fetchNetworkHome,
  peekNetworkHome,
  type NetworkHomeData,
} from "../lib/operator-api";
import { isLightHex } from "../lib/utils";
import { marcarBooted } from "../lib/boot-state";
import { LoadingScreen } from "../ui/loading-screen";
import { FormsBoard } from "../ui/forms-board";

export function NetworkHomePage() {
  const { memberId = "" } = useParams();
  const { user } = useAuth();
  const initial = peekNetworkHome(memberId);
  const [loading, setLoading] = useState(initial === null);
  const [data, setData] = useState<NetworkHomeData | null>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !memberId) return;

    let mounted = true;

    function apply(next: NetworkHomeData) {
      if (!mounted) return;
      setData(next);
      marcarBooted(); // home carregou → fim da "abertura"; próximos loads = logo
      applyPrimaryColor(next.brand.primaryColor);
      // Persiste a logo da rede p/ a tela de carregamento (último quadro).
      try {
        if (next.brand.logoUrl)
          localStorage.setItem("checkai-logo", next.brand.logoUrl);
        else localStorage.removeItem("checkai-logo");
      } catch {
        /* ignora */
      }
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
      {/* Banner da REDE: gradiente da cor da rede + logo em cartão + nome centralizados */}
      <div
        className="relative rounded-b-3xl px-5 pb-10 shadow-md ring-1 ring-black/5"
        style={{
          // Banner edge-to-edge: a cor sobe sob a barra de status; o conteúdo
          // (logo/nome) ganha o respiro da safe-area + o pt original (3rem).
          paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
          background: `linear-gradient(135deg, ${cor} 0%, color-mix(in srgb, ${cor} 78%, black) 100%)`,
          color: textoCor,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
            {data.brand.logoUrl ? (
              <img
                src={data.brand.logoUrl}
                alt={data.brand.nome}
                className="h-full w-full rounded-2xl object-contain p-1.5"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                <Store className="h-6 w-6" />
              </span>
            )}
          </div>
          <p className="text-xl font-bold tracking-tight">{data.brand.nome}</p>
          <p className="text-[13px] font-medium opacity-90">{subtitulo}</p>
        </div>
      </div>

      <div className="mx-auto -mt-5 w-full max-w-md flex-1 space-y-3 px-5">
        {error ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <FormsBoard
          membroId={memberId}
          redeId={data.membership.redeId}
          forms={data.forms}
        />
      </div>
    </div>
  );
}
