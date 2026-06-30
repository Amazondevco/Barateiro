import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillTab = {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  active: boolean;
};

// Controle segmentado (estilo do mockup): pílulas dentro de um cartão branco;
// a aba ativa é uma pílula escura (neutra) — o destaque/accent fica nos botões.
export function PillTabs({ tabs, className }: { tabs: PillTab[]; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm",
        className,
      )}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              t.active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
