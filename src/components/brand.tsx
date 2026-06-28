import { cn } from "@/lib/utils";

/** Marca Super Barateiro — placeholder até subir a logo real por tenant. */
export function Brand({
  className,
  compact = false,
  onDark = false,
}: {
  className?: string;
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              onDark ? "text-white" : "text-foreground",
            )}
          >
            Super Barateiro
          </span>
          <span
            className={cn(
              "text-[11px] font-medium",
              onDark ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            Gestão de Loja
          </span>
        </span>
      )}
    </span>
  );
}
