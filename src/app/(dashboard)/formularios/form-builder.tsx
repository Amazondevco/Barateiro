"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Sparkles,
  GripVertical,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveFormulario, type FormularioPayload } from "./actions";
import { AiFormDialog } from "./ai-form-dialog";
import type { AiForm } from "./ai-actions";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIPO_ITEM: { v: ItemTipo; l: string }[] = [
  { v: "ok_nao", l: "OK / NÃO" },
  { v: "sim_nao", l: "Sim / Não" },
  { v: "abastecido_ruptura", l: "Abastecido / Ruptura" },
  { v: "texto", l: "Texto" },
  { v: "numero", l: "Número" },
  { v: "data", l: "Data" },
  { v: "foto", l: "Foto" },
  { v: "assinatura", l: "Assinatura" },
  { v: "multipla_escolha", l: "Múltipla escolha" },
];

// Tipos de resposta em que "Obs./Foto ao Não" faz sentido
const TIPOS_NAO: ItemTipo[] = ["ok_nao", "sim_nao", "abastecido_ruptura"];

type BItem = {
  _id: string;
  texto: string;
  tipo: ItemTipo;
  obriga_obs: boolean;
  obriga_foto: boolean;
  opcoes: string[];
  ajuda: string;
};
type BSecao = {
  _id: string;
  titulo: string;
  permite_na: boolean;
  quebra_pagina: boolean;
  itens: BItem[];
};

let _seq = 0;
const uid = () => `f${++_seq}`;

const novoItem = (id: string): BItem => ({
  _id: id,
  texto: "",
  tipo: "ok_nao",
  obriga_obs: true,
  obriga_foto: true,
  opcoes: [],
  ajuda: "",
});

type Initial = {
  nome: string;
  descricao: string;
  tipo_unidade: UnidadeTipo;
  status: "ativo" | "inativo";
  departamentos: string[];
  secoes: {
    titulo: string;
    permite_na: boolean;
    quebra_pagina?: boolean;
    itens: {
      texto: string;
      tipo: ItemTipo;
      obriga_obs: boolean;
      obriga_foto: boolean;
      opcoes?: string[];
      ajuda?: string;
    }[];
  }[];
};

function initialSecoes(initial?: Initial): BSecao[] {
  if (initial?.secoes?.length) {
    return initial.secoes.map((s, i) => ({
      _id: `s${i}`,
      titulo: s.titulo,
      permite_na: s.permite_na,
      quebra_pagina: s.quebra_pagina ?? false,
      itens: s.itens.map((it, j) => ({
        _id: `s${i}i${j}`,
        texto: it.texto,
        tipo: it.tipo,
        obriga_obs: it.obriga_obs,
        obriga_foto: it.obriga_foto,
        opcoes: it.opcoes ?? [],
        ajuda: it.ajuda ?? "",
      })),
    }));
  }
  return [
    {
      _id: "s0",
      titulo: "",
      permite_na: true,
      quebra_pagina: false,
      itens: [novoItem("s0i0")],
    },
  ];
}

export function FormBuilder({
  redeId,
  formId,
  departamentos,
  initial,
}: {
  redeId: string;
  formId: string | null;
  departamentos: { id: string; nome: string }[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [tipoUnidade, setTipoUnidade] = useState<UnidadeTipo>(
    initial?.tipo_unidade ?? "loja",
  );
  const [status, setStatus] = useState<"ativo" | "inativo">(
    initial?.status ?? "ativo",
  );
  const [deps, setDeps] = useState<string[]>(initial?.departamentos ?? []);
  const [secoes, setSecoes] = useState<BSecao[]>(() => initialSecoes(initial));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ---- mutações por id ----
  const patchSecao = (sid: string, patch: Partial<BSecao>) =>
    setSecoes((s) => s.map((x) => (x._id === sid ? { ...x, ...patch } : x)));
  const removeSecao = (sid: string) =>
    setSecoes((s) => s.filter((x) => x._id !== sid));
  const addItem = (sid: string) =>
    setSecoes((s) =>
      s.map((x) =>
        x._id === sid ? { ...x, itens: [...x.itens, novoItem(uid())] } : x,
      ),
    );
  const patchItem = (sid: string, iid: string, patch: Partial<BItem>) =>
    setSecoes((s) =>
      s.map((x) =>
        x._id === sid
          ? {
              ...x,
              itens: x.itens.map((it) =>
                it._id === iid ? { ...it, ...patch } : it,
              ),
            }
          : x,
      ),
    );
  const removeItem = (sid: string, iid: string) =>
    setSecoes((s) =>
      s.map((x) =>
        x._id === sid
          ? { ...x, itens: x.itens.filter((it) => it._id !== iid) }
          : x,
      ),
    );
  const addSecao = () =>
    setSecoes((s) => [
      ...s,
      {
        _id: uid(),
        titulo: "",
        permite_na: true,
        quebra_pagina: false,
        itens: [novoItem(uid())],
      },
    ]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const aid = String(active.id);
    const oid = String(over.id);

    // seção?
    if (secoes.some((s) => s._id === aid)) {
      const oldI = secoes.findIndex((s) => s._id === aid);
      const newI = secoes.findIndex((s) => s._id === oid);
      if (newI >= 0) setSecoes((s) => arrayMove(s, oldI, newI));
      return;
    }
    // item (só reordena dentro da mesma seção)
    const si = secoes.findIndex((s) => s.itens.some((it) => it._id === aid));
    const sj = secoes.findIndex((s) => s.itens.some((it) => it._id === oid));
    if (si < 0 || si !== sj) return;
    const oldI = secoes[si].itens.findIndex((it) => it._id === aid);
    const newI = secoes[si].itens.findIndex((it) => it._id === oid);
    setSecoes((s) =>
      s.map((x, idx) =>
        idx === si ? { ...x, itens: arrayMove(x.itens, oldI, newI) } : x,
      ),
    );
  }

  function applyAi(data: AiForm) {
    setNome(data.nome);
    setDescricao(data.descricao);
    setTipoUnidade(data.tipo_unidade);
    if (data.secoes.length)
      setSecoes(
        data.secoes.map((s, i) => ({
          _id: uid(),
          titulo: s.titulo,
          permite_na: s.permite_na,
          quebra_pagina: i > 0,
          itens: s.itens.map((it) => ({
            _id: uid(),
            texto: it.texto,
            tipo: it.tipo,
            obriga_obs: it.obriga_obs,
            obriga_foto: it.obriga_foto,
            opcoes: [],
            ajuda: "",
          })),
        })),
      );
  }

  function save() {
    setError(null);
    const payload: FormularioPayload = {
      nome,
      descricao,
      tipo_unidade: tipoUnidade,
      status,
      departamentos: deps,
      secoes: secoes.map((s) => ({
        titulo: s.titulo,
        permite_na: s.permite_na,
        quebra_pagina: s.quebra_pagina,
        itens: s.itens.map((it) => ({
          texto: it.texto,
          tipo: it.tipo,
          obriga_obs: it.obriga_obs,
          obriga_foto: it.obriga_foto,
          opcoes: it.opcoes,
          ajuda: it.ajuda,
        })),
      })),
    };
    startTransition(async () => {
      const res = await saveFormulario(redeId, formId, payload);
      if (res.error) setError(res.error);
      else router.push("/formularios");
    });
  }

  return (
    <div className="max-w-4xl space-y-6 pb-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/formularios")}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button type="button" variant="outline" onClick={() => setAiOpen(true)}>
          <Sparkles className="h-4 w-4" /> Criar com IA
        </Button>
      </div>
      {aiOpen && (
        <AiFormDialog onClose={() => setAiOpen(false)} onGenerated={applyAi} />
      )}

      {/* Dados */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Dados do formulário</h3>
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Checklist Diário do Gerente"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo">Tipo de unidade</Label>
              <Select
                id="tipo"
                value={tipoUnidade}
                onChange={(e) => setTipoUnidade(e.target.value as UnidadeTipo)}
              >
                <option value="loja">Loja</option>
                <option value="cd">CD / Galpão</option>
                <option value="escritorio">Escritório</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ativo" | "inativo")
                }
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departamentos */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-semibold">Atribuir a departamentos</h3>
          {departamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum departamento cadastrado. Crie em Configurações →
              Departamentos.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departamentos.map((d) => {
                const on = deps.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setDeps((v) =>
                        on ? v.filter((x) => x !== d.id) : [...v, d.id],
                      )
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted",
                    )}
                  >
                    {d.nome}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seções + itens com drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={secoes.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {secoes.map((sec, si) => (
              <SectionCard
                key={sec._id}
                sec={sec}
                index={si}
                onPatch={patchSecao}
                onRemove={removeSecao}
                onAddItem={addItem}
                onPatchItem={patchItem}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" onClick={addSecao}>
        <Plus className="h-4 w-4" /> Adicionar seção
      </Button>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/formularios")}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar formulário"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Seção ---------------- */

function SectionCard({
  sec,
  index,
  onPatch,
  onRemove,
  onAddItem,
  onPatchItem,
  onRemoveItem,
}: {
  sec: BSecao;
  index: number;
  onPatch: (sid: string, patch: Partial<BSecao>) => void;
  onRemove: (sid: string) => void;
  onAddItem: (sid: string) => void;
  onPatchItem: (sid: string, iid: string, patch: Partial<BItem>) => void;
  onRemoveItem: (sid: string, iid: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sec._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {sec.quebra_pagina && index > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <span className="h-px flex-1 bg-primary/30" />
          Nova etapa (página) no celular
          <span className="h-px flex-1 bg-primary/30" />
        </div>
      )}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
              aria-label="Arrastar seção"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <input
              value={sec.titulo}
              onChange={(e) => onPatch(sec._id, { titulo: e.target.value })}
              placeholder={`Seção ${index + 1} (ex.: Hortifrúti)`}
              className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={sec.quebra_pagina}
                onChange={(e) =>
                  onPatch(sec._id, { quebra_pagina: e.target.checked })
                }
                className="accent-[var(--primary)]"
              />
              Quebra de página
            </label>
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={sec.permite_na}
                onChange={(e) =>
                  onPatch(sec._id, { permite_na: e.target.checked })
                }
                className="accent-[var(--primary)]"
              />
              N/A
            </label>
            <button
              type="button"
              onClick={() => onRemove(sec._id)}
              aria-label="Remover seção"
              className="shrink-0 text-muted-foreground hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <SortableContext
              items={sec.itens.map((it) => it._id)}
              strategy={verticalListSortingStrategy}
            >
              {sec.itens.map((it) => (
                <ItemRow
                  key={it._id}
                  sid={sec._id}
                  item={it}
                  onPatch={onPatchItem}
                  onRemove={onRemoveItem}
                />
              ))}
            </SortableContext>
            <button
              type="button"
              onClick={() => onAddItem(sec._id)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-sm font-medium text-primary hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Adicionar item
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Item ---------------- */

function ItemRow({
  sid,
  item,
  onPatch,
  onRemove,
}: {
  sid: string;
  item: BItem;
  onPatch: (sid: string, iid: string, patch: Partial<BItem>) => void;
  onRemove: (sid: string, iid: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const mostraNao = TIPOS_NAO.includes(item.tipo);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-t border-border first:border-t-0"
    >
      <div className="flex flex-wrap items-center gap-2 px-2 py-2 sm:flex-nowrap">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Arrastar item"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <input
          value={item.texto}
          onChange={(e) => onPatch(sid, item._id, { texto: e.target.value })}
          placeholder="Descreva o que verificar…"
          className="min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <select
          value={item.tipo}
          onChange={(e) =>
            onPatch(sid, item._id, { tipo: e.target.value as ItemTipo })
          }
          className="h-8 w-full shrink-0 rounded-md border border-input bg-card px-2 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-44"
        >
          {TIPO_ITEM.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </select>
        {mostraNao && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() =>
                onPatch(sid, item._id, { obriga_obs: !item.obriga_obs })
              }
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition",
                item.obriga_obs
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Obs.
            </button>
            <button
              type="button"
              onClick={() =>
                onPatch(sid, item._id, { obriga_foto: !item.obriga_foto })
              }
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition",
                item.obriga_foto
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              Foto
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Configurar item"
          className={cn(
            "shrink-0 transition-colors",
            open ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(sid, item._id)}
          className="shrink-0 text-muted-foreground hover:text-danger"
          aria-label="Remover item"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-dashed border-border bg-muted/30 px-3 py-3">
          <div>
            <Label htmlFor={`ajuda-${item._id}`} className="text-xs">
              Texto de ajuda (aparece para quem preenche)
            </Label>
            <Input
              id={`ajuda-${item._id}`}
              value={item.ajuda}
              onChange={(e) => onPatch(sid, item._id, { ajuda: e.target.value })}
              placeholder="Ex.: confira a etiqueta de validade na embalagem"
              className="h-9"
            />
          </div>

          {item.tipo === "multipla_escolha" && (
            <div>
              <Label className="text-xs">Opções</Label>
              <div className="space-y-2">
                {item.opcoes.map((op, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <Input
                      value={op}
                      onChange={(e) =>
                        onPatch(sid, item._id, {
                          opcoes: item.opcoes.map((x, k) =>
                            k === oi ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder={`Opção ${oi + 1}`}
                      className="h-9"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onPatch(sid, item._id, {
                          opcoes: item.opcoes.filter((_, k) => k !== oi),
                        })
                      }
                      className="text-muted-foreground hover:text-danger"
                      aria-label="Remover opção"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPatch(sid, item._id, { opcoes: [...item.opcoes, ""] })
                  }
                >
                  <Plus className="h-4 w-4" /> Adicionar opção
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
