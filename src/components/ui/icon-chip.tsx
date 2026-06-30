import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Paleta decorativa (tons suaves) para os chips de ícone das linhas de tabela —
// constante do produto, como os avatares coloridos. A cor sai de um seed (nome),
// então é estável por item. Não confundir com a cor da rede (--primary).
const TONS = [
  "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
];

function tomDoSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONS[h % TONS.length];
}

// Chip quadrado arredondado com ícone OU iniciais, na cor derivada do seed.
export function IconChip({
  icon: Icon,
  text,
  seed,
  className,
}: {
  icon?: LucideIcon;
  text?: string;
  seed: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
        tomDoSeed(seed),
        className,
      )}
    >
      {Icon ? <Icon className="h-5 w-5" /> : (text ?? "").slice(0, 2).toUpperCase()}
    </span>
  );
}

// Célula-líder de tabela: chip + título e (opcional) subtítulo em 2 linhas.
export function LeadCell({
  icon,
  text,
  seed,
  title,
  subtitle,
}: {
  icon?: LucideIcon;
  text?: string;
  seed: string;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} text={text} seed={seed} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
