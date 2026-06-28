import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
  crumb,
  rootLabel = "Console",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  crumb?: string;
  rootLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <nav className="mb-1 flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="font-semibold text-primary hover:underline"
          >
            {rootLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{crumb ?? title}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
