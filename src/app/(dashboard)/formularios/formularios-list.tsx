"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
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
};
type Unidade = { id: string; nome: string; tipo: string };
type Departamento = { id: string; nome: string; unidade_id: string | null };

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
}: {
  forms: FormItem[];
  unidades: Unidade[];
  departamentos: Departamento[];
}) {
  const [selTipos, setSelTipos] = useState<string[]>([]);
  const [selUnidades, setSelUnidades] = useState<string[]>([]);
  const [selDeps, setSelDeps] = useState<string[]>([]);

  const filtered = forms.filter((f) => {
    if (selTipos.length && !selTipos.includes(f.tipo_unidade)) return false;

    if (selDeps.length) {
      const ok =
        f.depIds.length === 0 || f.depIds.some((d) => selDeps.includes(d));
      if (!ok) return false;
    }

    if (selUnidades.length) {
      const ok = selUnidades.some((uid) => {
        const u = unidades.find((x) => x.id === uid);
        if (!u || f.tipo_unidade !== u.tipo) return false;
        if (f.depIds.length === 0) return true; // aplica a todos
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
      {/* Filtros + Novo formulário (mesmo nível) */}
      <div className="flex flex-wrap items-end gap-3">
        <Filtro label="Tipo de formulário" empty="Todos os tipos">
          <MultiSelect
            emptyLabel="Todos os tipos"
            options={TIPO_OPTS}
            selected={selTipos}
            onChange={setSelTipos}
          />
        </Filtro>
        <Filtro label="Unidade" empty="Todas as unidades">
          <MultiSelect
            emptyLabel="Todas as unidades"
            options={unidades}
            selected={selUnidades}
            onChange={setSelUnidades}
            emptyHint="Nenhuma unidade."
          />
        </Filtro>
        <Filtro label="Departamento" empty="Todos os deptos">
          <MultiSelect
            emptyLabel="Todos os deptos"
            options={departamentos}
            selected={selDeps}
            onChange={setSelDeps}
            emptyHint="Nenhum departamento."
          />
        </Filtro>

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

function Filtro({
  label,
  children,
}: {
  label: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-48">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
