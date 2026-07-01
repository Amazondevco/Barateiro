// Marca Check.AI (logo verde + wordmark) — igual à tela de login do app.
// Componente puro (sem hooks), usável em Server e Client Components.
export function CheckaiMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/checkai-logo.svg"
        alt="Check.AI"
        className="h-10 w-10 rounded-2xl shadow-sm"
      />
      <span className="text-xl font-bold tracking-tight">
        Check<span className="text-[#15803d]">.AI</span>
      </span>
    </div>
  );
}
