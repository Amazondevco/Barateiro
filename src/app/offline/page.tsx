export const metadata = { title: "Offline — Check.AI" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F97316] text-white">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l18 18" />
          <path d="M10.7 5.1A11 11 0 0 1 21 9" />
          <path d="M3 9a11 11 0 0 1 5-2.5" />
          <path d="M6.5 12.5A6 6 0 0 1 12 11" />
          <path d="M12 15h.01" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold">Você está offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Sem conexão no momento. As telas já abertas continuam disponíveis. Quando
        o sinal voltar, atualize a página.
      </p>
    </div>
  );
}
