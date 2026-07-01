import { useEffect, useState } from "react";
import { BellRing, Clock, Mail } from "lucide-react";
import { fetchComunicados, peekComunicados, type Comunicado } from "../lib/operator-api";
import { LoadingScreen } from "../ui/loading-screen";
import { useI18n } from "../lib/i18n/i18n";

export function NoticesPage() {
  const { t } = useI18n();
  const initial = peekComunicados();
  const [loading, setLoading] = useState(initial === null);
  const [avisos, setAvisos] = useState<Comunicado[]>(initial ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Cache-first: instantâneo se já houver cache; revalida em 2º plano.
        const lista = await fetchComunicados((fresh) => {
          if (mounted) setAvisos(fresh);
        });
        if (mounted) setAvisos(lista);
      } catch (loadError) {
        if (mounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("Falha ao carregar avisos."),
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
    return <LoadingScreen label={t("Carregando avisos…")} />;
  }

  if (avisos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <p className="font-medium">{t("Sem avisos por enquanto")}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {error ?? "Comunicados e mensagens da sua rede vão aparecer aqui."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-5">
      <header className="mb-2 mt-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("Avisos")}</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Comunicados da sua rede.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {avisos.map((aviso, i) => {
        const novo = i === 0;
        return (
          <article
            key={aviso.id}
            className={`relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm ${
              novo ? "border-l-4 border-l-primary" : ""
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                novo
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-tight">{aviso.titulo}</h2>
                {novo && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Novo
                  </span>
                )}
              </div>
              <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {aviso.corpo}
              </p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(aviso.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
