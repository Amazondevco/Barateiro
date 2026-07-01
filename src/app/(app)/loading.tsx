// Skeleton de carregamento do app do operador (web). Torna a troca de tela
// instantânea (mostra este esqueleto na hora) em vez de congelar na tela
// anterior até o servidor responder.
export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
