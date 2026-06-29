import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { fetchComunicados, type Comunicado } from "../lib/operator-api";
import { LoadingScreen } from "../ui/loading-screen";

export function NoticesPage() {
  const [loading, setLoading] = useState(true);
  const [avisos, setAvisos] = useState<Comunicado[]>([]);
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
              : "Falha ao carregar avisos.",
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
    return <LoadingScreen label="Carregando avisos…" />;
  }

  if (avisos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <p className="font-medium">Sem avisos por enquanto</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {error ?? "Comunicados e mensagens da sua rede vão aparecer aqui."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      <header className="mt-2">
        <h1 className="text-xl font-semibold">Avisos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comunicados da sua rede.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {avisos.map((aviso) => (
        <article
          key={aviso.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="font-medium">{aviso.titulo}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {aviso.corpo}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(aviso.createdAt).toLocaleString("pt-BR")}
          </p>
        </article>
      ))}
    </div>
  );
}
