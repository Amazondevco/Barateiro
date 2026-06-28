import { Search } from "lucide-react";

// Busca que expande para a esquerda no hover/foco, com a lupa DENTRO do campo.
export function TopbarSearch() {
  return (
    <div className="group relative hidden items-center justify-end md:flex">
      <input
        type="search"
        placeholder="Buscar…"
        className="h-9 w-9 cursor-pointer rounded-lg border border-transparent bg-transparent pl-3 pr-9 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-transparent group-hover:w-56 group-hover:cursor-text group-hover:border-foreground/20 group-hover:bg-foreground/10 group-hover:placeholder:text-muted-foreground focus:w-56 focus:cursor-text focus:border-foreground/20 focus:bg-foreground/10 focus:placeholder:text-muted-foreground"
      />
      <Search className="pointer-events-none absolute right-2.5 h-5 w-5 text-foreground" />
    </div>
  );
}
