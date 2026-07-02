"use client";

import { useRouter, usePathname } from "next/navigation";

type Opt = { id: string; nome: string };

export function RelatoriosFiltros({
  unidades,
  departamentos,
  unidade,
  dep,
}: {
  unidades: Opt[];
  departamentos: Opt[];
  unidade: string;
  dep: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function navegar(next: { unidade?: string; dep?: string }) {
    const p = new URLSearchParams();
    const u = next.unidade ?? unidade;
    const d = next.dep ?? dep;
    if (u) p.set("unidade", u);
    if (d) p.set("dep", d);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const selCls =
    "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        aria-label="Filtrar por unidade"
        value={unidade}
        onChange={(e) => navegar({ unidade: e.target.value })}
        className={selCls}
      >
        <option value="">Todas as unidades</option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrar por departamento"
        value={dep}
        onChange={(e) => navegar({ dep: e.target.value })}
        className={selCls}
      >
        <option value="">Todos os departamentos</option>
        {departamentos.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
