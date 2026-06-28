import { Boxes } from "lucide-react";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Marca exibida no shell/login.
 * Padrão = plataforma (Amazon Dev & Co.). Passe `name`/`logoUrl` para
 * white-label do tenant (rede-cliente).
 */
export function Brand({
  className,
  compact = false,
  onDark = false,
  name = PLATFORM_NAME,
  subtitle = PLATFORM_TAGLINE,
  logoUrl,
}: {
  className?: string;
  compact?: boolean;
  onDark?: boolean;
  name?: string;
  subtitle?: string;
  logoUrl?: string | null;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Boxes className="h-5 w-5" />
        </span>
      )}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              onDark ? "text-white" : "text-foreground",
            )}
          >
            {name}
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-[11px] font-medium",
                onDark ? "text-sidebar-muted" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
