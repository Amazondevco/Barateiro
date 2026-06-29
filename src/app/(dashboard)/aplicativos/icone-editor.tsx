"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Info, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { salvarIcone } from "./icone-actions";
import {
  pessoaCasaIcone,
  type AppIcone,
  type Opt,
  type RosterPessoa,
} from "./icone-types";
import { CompartilharApp } from "./compartilhar-app";

const CORES = ["#F97316", "#3B82F6", "#22C55E", "#8B5CF6", "#EF4444", "#14B8A6", "#EC4899", "#6B7280"];

export function IconeEditor({
  icone,
  cargos,
  unidades,
  departamentos,
  roster,
}: {
  icone: AppIcone | null;
  cargos: Opt[];
  unidades: Opt[];
  departamentos: Opt[];
  roster: RosterPessoa[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"visual" | "acesso" | "usuarios">("visual");
  const [nome, setNome] = useState(icone?.nome ?? "");
  const [nomeCurto, setNomeCurto] = useState(icone?.nomeCurto ?? "");
  const [cor, setCor] = useState(icone?.cor ?? CORES[0]);
  const [selCargos, setSelCargos] = useState<string[]>(icone?.cargos ?? []);
  const [selUnidades, setSelUnidades] = useState<string[]>(icone?.unidades ?? []);
  const [selDeptos, setSelDeptos] = useState<string[]>(icone?.departamentos ?? []);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewLabel = nomeCurto || nome.slice(0, 12) || "App";
  const initials =
    nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "A";

  // visão derivada: quem do roster casa com o filtro atual
  const filtroAtual: AppIcone = {
    id: "", nome, nomeCurto, cor,
    cargos: selCargos, unidades: selUnidades, departamentos: selDeptos,
  };
  const comAcesso = useMemo(
    () => roster.filter((p) => pessoaCasaIcone(p, filtroAtual)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roster, selCargos, selUnidades, selDeptos],
  );
  const visiveis = comAcesso.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  function salvar() {
    if (!nome.trim()) {
      setTab("visual");
      return setErro("Informe o nome do app.");
    }
    setErro(null);
    startTransition(async () => {
      const r = await salvarIcone({
        id: icone?.id,
        nome, nomeCurto, cor,
        cargos: selCargos, unidades: selUnidades, departamentos: selDeptos,
      });
      if (r.error) setErro(r.error);
      else router.push("/aplicativos");
    });
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5">
          <div className="flex">
            {(["visual", "acesso", "usuarios"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "visual" ? "Visual" : t === "acesso" ? "Acesso" : `Usuários (${comAcesso.length})`}
              </button>
            ))}
          </div>
          <CompartilharApp icone={{ id: icone?.id, nome, nomeCurto: nomeCurto || nome }} />
        </div>

        <div className="p-5">
          {tab === "visual" && (
            <div className="grid grid-cols-[160px_1fr] gap-8 items-start">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-[22px] transition-opacity hover:opacity-90"
                  style={{ backgroundColor: cor }}
                  aria-label="Trocar ícone"
                >
                  <Upload className="h-6 w-6 text-white/80" />
                  <span className="mt-1 text-[10px] text-white/70">Trocar</span>
                </button>
                <p className="text-center text-xs text-muted-foreground">512×512px · PNG ou SVG</p>
                <div className="rounded-lg border border-border bg-muted/30 px-5 py-3 text-center">
                  <p className="mb-2 text-[10px] text-muted-foreground">Preview</p>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] text-xs font-semibold text-white" style={{ backgroundColor: cor }}>
                      {initials}
                    </div>
                    <span className="text-[10px] text-foreground">{previewLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="icone-nome">Nome do app</Label>
                  <Input id="icone-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: App Gerentes" />
                </div>
                <div>
                  <Label htmlFor="icone-curto">Nome curto <span className="font-normal text-muted-foreground">(embaixo do ícone)</span></Label>
                  <Input id="icone-curto" value={nomeCurto} onChange={(e) => setNomeCurto(e.target.value.slice(0, 12))} placeholder="Ex: Gerentes" maxLength={12} />
                  <p className="mt-1 text-xs text-muted-foreground">{nomeCurto.length}/12 caracteres</p>
                </div>
                <div>
                  <Label>Cor do tema</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {CORES.map((c) => (
                      <button key={c} type="button" onClick={() => setCor(c)} className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                        style={{ backgroundColor: c, boxShadow: cor === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined }}
                        aria-label={`Cor ${c}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "acesso" && (
            <div className="flex flex-col gap-5 max-w-lg">
              <div>
                <Label>Cargos com acesso <span className="font-normal text-muted-foreground">(vazio = todos)</span></Label>
                <MultiSelect emptyLabel="Todos os cargos" options={cargos} selected={selCargos} onChange={setSelCargos} emptyHint="Nenhum cargo." />
              </div>
              <div>
                <Label>Unidades <span className="font-normal text-muted-foreground">(vazio = todas)</span></Label>
                <MultiSelect emptyLabel="Todas as unidades" options={unidades} selected={selUnidades} onChange={setSelUnidades} emptyHint="Nenhuma unidade." />
              </div>
              <div>
                <Label>Departamentos <span className="font-normal text-muted-foreground">(vazio = todos)</span></Label>
                <MultiSelect emptyLabel="Todos os departamentos" options={departamentos} selected={selDeptos} onChange={setSelDeptos} emptyHint="Nenhum departamento." />
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg px-3 py-2.5 text-sm text-warning">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Quem casa com o filtro vê este app. <strong>{comAcesso.length}</strong> pessoa(s) da equipe têm acesso.</p>
              </div>
            </div>
          )}

          {tab === "usuarios" && (
            <div className="flex flex-col gap-3 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa…" className="pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">{comAcesso.length} pessoa(s) têm acesso a este app</p>
              {comAcesso.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Ninguém da equipe casa com este filtro. Ajuste o Acesso ou adicione pessoas na Equipe do app.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {visiveis.map((p) => {
                    const ini = p.nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-card">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{ini}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.nome}</p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          p.status === "vinculado" ? "bg-success-bg text-success" : "bg-warning-bg text-warning")}>
                          {p.status === "vinculado" ? "Cadastrado" : "Aguardando"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {erro && <p className="mt-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>}

          <div className="mt-8 flex justify-end gap-2 border-t border-border pt-5">
            <Button variant="outline" onClick={() => router.push("/aplicativos")}>Cancelar</Button>
            <Button disabled={pending} onClick={salvar}>
              {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar ícone"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
