import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Cabeçalho das subtelas do console admin: voltar + título + slot de ação.
export function AdminSubHeader({
  title,
  back = "/app/admin",
  children,
}: {
  title: string;
  back?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Link
        href={back}
        aria-label="Voltar"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h1>
      {children}
    </header>
  );
}
