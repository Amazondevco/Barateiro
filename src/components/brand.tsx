"use client";

import { useState } from "react";
import { Boxes } from "lucide-react";
import { PLATFORM_NAME, PLATFORM_TAGLINE, PLATFORM_LOGO } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Marca exibida no shell/login.
 * Padrão = plataforma (Amazon Dev & Co., com logo). Passe `name`/`logoUrl`
 * para white-label do tenant (rede-cliente).
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
  const [imgError, setImgError] = useState(false);
  const isPlatform = name === PLATFORM_NAME;
  // Plataforma usa a logo fixa; tenant usa a própria (ou ícone se não tiver)
  const finalLogo = logoUrl ?? (isPlatform ? PLATFORM_LOGO : null);
  const showImg = !!finalLogo && !imgError;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={finalLogo}
          alt={name}
          onError={() => setImgError(true)}
          className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Boxes className="h-6 w-6" />
        </span>
      )}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              !onDark && "text-foreground",
            )}
            style={onDark ? { color: "var(--sidebar-strong)" } : undefined}
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
