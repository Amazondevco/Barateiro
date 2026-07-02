import type { LucideIcon } from "lucide-react";

// Placeholder das seções do console admin enquanto as fases não chegam.
export function AdminEmBreve({
  icon: Icon,
  titulo,
  desc,
}: {
  icon: LucideIcon;
  titulo: string;
  desc: string;
}) {
  return (
    <div className="p-5">
      <h1 className="text-xl font-bold">{titulo}</h1>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="max-w-xs text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
