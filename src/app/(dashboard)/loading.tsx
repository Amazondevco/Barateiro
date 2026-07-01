// Skeleton de carregamento do dashboard. No App Router, isto cria um limite de
// Suspense: a troca de página fica INSTANTÂNEA (mostra este esqueleto na hora)
// em vez de congelar na página anterior até o servidor terminar as consultas.
// Também permite ao Next fazer prefetch das rotas dinâmicas até este limite.
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* título + controle segmentado / ações */}
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 w-full max-w-md animate-pulse rounded-xl bg-muted" />

      {/* cartão/tabela */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="hidden h-4 w-40 animate-pulse rounded bg-muted sm:block" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
