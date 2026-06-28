"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { MultiSelect } from "@/components/ui/multi-select";

type FormItem = {
  id: string;
  nome: string;
  status: string;
  tipo_unidade: string;
  secoes: number;
  depIds: string[];
  userIds: string[];
};
type Unidade = { id: string; nome: string; tipo: string };
type Departamento = { id: string; nome: string; unidade_id: string | null };
type Usuario = { id: string; nome: string; departamento_id: string | null };

const TIPO_OPTS = [
  { id: "loja", nome: "Loja" },
  { id: "cd", nome: "CD / Galpão" },
  { id: "escritorio", nome: "Escritório" },
  { id: "outro", nome: "Outro" },
];

export function FormulariosList({
  forms,
  unidades,
  departamentos,
  usuarios,
}: {
  forms: FormItem[];
  unidades: Unidade[];
  departamentos: Departamento[];
  usuarios: Usuario[];
}) {
  const [busca, setBusca] = useState("");
  const [selTipos, setSelTipos] = useState<string[]>([]);
  const [selUnidades, setSelUnidades] = useState<string[]>([]);
  const [selDeps, setSelDeps] = useState<string[]>([]);
  const [selUsuarios, setSelUsuarios] = useState<string[]>([]);

  // Cascata Unidade → Departamento → Usuário
  const depsForUnits = (units: string[]) =>
    units.length
      ? departamentos.filter(
          (d) => d.unidade_id === null || units.includes(d.unidade_id),
        )
      : departamentos;
  const usersFor = (units: string[], deps: string[]) => {
    if (!units.length && !deps.length) return usuarios;
    const eff = deps.length ? deps : depsForUnits(units).map((d) => d.id);
    return usuarios.filter(
      (u) => u.departamento_id && eff.includes(u.departamento_id),
    );
  };
  const depsVisiveis = depsForUnits(selUnidades);
  const usuariosVisiveis = usersFor(selUnidades, selDeps);

  function onUnidades(next: string[]) {
    const vdepIds = new Set(depsForUnits(next).map((d) => d.id));
    const newDeps = selDeps.filter((id) => vdepIds.has(id));
    const vuserIds = new Set(usersFor(next, newDeps).map((u) => u.id));
    setSelUnidades(next);
    setSelDeps(newDeps);
    setSelUsuarios((p) => p.filter((id) => vuserIds.has(id)));
  }
  function onDeps(next: string[]) {
    const vuserIds = new Set(usersFor(selUnidades, next).map((u) => u.id));
    setSelDeps(next);
    setSelUsuarios((p) => p.filter((id) => vuserIds.has(id)));
  }

  const filtered = forms.filter((f) => {
    if (
      busca.trim() &&
      !f.nome.toLowerCase().includes(busca.trim().toLowerCase())
    )
      return false;
    if (selTipos.length && !selTipos.includes(f.tipo_unidade)) return false;

    if (selDeps.length) {
      const ok =
        f.depIds.length === 0 || f.depIds.some((d) => selDeps.includes(d));
      if (!ok) return false;
    }

    if (selUsuarios.length) {
      const ok =
        f.userIds.length === 0 || f.userIds.some((u) => selUsuarios.includes(u));
      if (!ok) return false;
    }

    if (selUnidades.length) {
      const ok = selUnidades.some((uid) => {
        const u = unidades.find((x) => x.id === uid);
        if (!u || f.tipo_unidade !== u.tipo) return false;
        if (f.depIds.length === 0) return true;
        return f.depIds.some((did) => {
          const dep = departamentos.find((d) => d.id === did);
          return dep && (dep.unidade_id === u.id || dep.unidade_id === null);
        });
      });
      if (!ok) return false;
    }

    return true;
  });

  if (forms.length === 0) {
    return (
      <EmptyState
        title="Nenhum formulário ainda"
        description="Crie o primeiro modelo de checklist para suas unidades."
        action={
          <Link href="/formularios/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo formulário
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar formulário…"
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <Campo label="Tipo de formulário">
          <MultiSelect
            emptyLabel="Todos os tipos"
            options={TIPO_OPTS}
            selected={selTipos}
            onChange={setSelTipos}
          />
        </Campo>
        <Campo label="Unidade">
          <MultiSelect
            emptyLabel="Todas as unidades"
            options={unidades}
            selected={selUnidades}
            onChange={onUnidades}
            emptyHint="Nenhuma unidade."
          />
        </Campo>
        <Campo label="Departamento">
          <MultiSelect
            emptyLabel="Todos os deptos"
            options={depsVisiveis}
            selected={selDeps}
            onChange={onDeps}
            emptyHint="Nenhum departamento."
          />
        </Campo>
        <Campo label="Usuário">
          <MultiSelect
            emptyLabel="Todos os usuários"
            options={usuariosVisiveis}
            selected={selUsuarios}
            onChange={setSelUsuarios}
            emptyHint="Nenhum usuário."
          />
        </Campo>

        <Link href="/formularios/novo" className="ml-auto">
          <Button>
            <Plus className="h-4 w-4" /> Novo formulário
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum formulário para os filtros"
          description="Ajuste os filtros para ver mais resultados."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <Link key={f.id} href={`/formularios/${f.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <Badge tone={f.status === "ativo" ? "success" : "neutral"}>
                      {f.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-semibold">{f.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {f.secoes} {f.secoes === 1 ? "seção" : "seções"} ·{" "}
                      {f.depIds.length === 0
                        ? "todos os deptos"
                        : `${f.depIds.length} ${f.depIds.length === 1 ? "depto" : "deptos"}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-44">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
