"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiSelect({
  emptyLabel,
  options,
  selected,
  onChange,
  emptyHint = "Nada disponível",
}: {
  emptyLabel: string;
  options: { id: string; nome: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const summary =
    selected.length === 0
      ? emptyLabel
      : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm transition-colors hover:bg-muted"
      >
        <span
          className={selected.length ? "text-foreground" : "text-muted-foreground"}
        >
          {summary}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyHint}</p>
          ) : (
            options.map((o) => {
              const on = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    on && "font-medium text-primary",
                  )}
                >
                  {o.nome}
                  {on && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
