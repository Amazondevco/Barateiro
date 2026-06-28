import { Search } from "lucide-react";

// Busca que expande para a esquerda ao passar o mouse (ou ao focar).
export function TopbarSearch() {
  return (
    <div className="group hidden items-center md:flex">
      <input
        type="search"
        placeholder="Buscar…"
        className="h-9 w-0 rounded-lg border border-transparent bg-transparent px-0 text-sm opacity-0 outline-none transition-all duration-200 placeholder:text-muted-foreground group-hover:w-56 group-hover:border-foreground/20 group-hover:bg-foreground/10 group-hover:px-3 group-hover:opacity-100 focus:w-56 focus:border-foreground/20 focus:bg-foreground/10 focus:px-3 focus:opacity-100"
      />
      <button
        type="button"
        aria-label="Buscar"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
}
