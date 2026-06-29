"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  PenLine,
  Camera,
  Trash2,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SignaturePad } from "../../../../signature-pad";

type Item = {
  id: string;
  texto: string;
  ordem: number;
  tipo: string;
  opcoes: string[] | null;
  ajuda: string | null;
  obriga_obs_quando_nao: boolean;
  obriga_foto_quando_nao: boolean;
};
type Secao = {
  id: string;
  titulo: string;
  ordem: number;
  permite_na: boolean;
  quebra_pagina: boolean;
  formulario_itens: Item[];
};
export type FormData = {
  id: string;
  nome: string;
  descricao: string | null;
  formulario_secoes: Secao[];
};

// pares de botões por tipo
const PARES: Record<string, [string, string][]> = {
  ok_nao: [["ok", "OK"], ["nao", "NÃO"]],
  sim_nao: [["sim", "Sim"], ["nao", "Não"]],
  abastecido_ruptura: [["abastecido", "Abastecido"], ["ruptura", "Ruptura"]],
};

// label legível de um valor (para a revisão)
function rotuloValor(item: Item, valor: string): string {
  if (!valor) return "—";
  if (valor === "na") return "N/A";
  const par = PARES[item.tipo]?.find(([v]) => v === valor);
  if (par) return par[1];
  return valor;
}

export function FillForm({
  redeMembroId,
  form,
  assinatura,
}: {
  redeMembroId: string;
  form: FormData;
  assinatura: string | null;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [assinada, setAssinada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(0);
  const [revisando, setRevisando] = useState(false);

  function setVal(id: string, v: string) {
    setValores((p) => ({ ...p, [id]: v }));
  }

  // Agrupa seções em etapas (páginas) pela quebra de página — igual à prévia.
  const etapas = useMemo(() => {
    const out: Secao[][] = [];
    form.formulario_secoes.forEach((sec, i) => {
      if (i === 0 || sec.quebra_pagina) out.push([sec]);
      else out[out.length - 1].push(sec);
    });
    return out;
  }, [form.formulario_secoes]);

  const total = etapas.length;
  const idx = Math.min(etapa, Math.max(0, total - 1));
  const ultima = idx >= total - 1;

  // Primeira pendência obrigatória (obs/foto exigida em não-conformidade)
  function pendencia(): string | null {
    for (const s of form.formulario_secoes) {
      for (const it of s.formulario_itens) {
        const v = valores[it.id] ?? "";
        const naoConforme = ["nao", "ruptura"].includes(v);
        if (it.obriga_obs_quando_nao && naoConforme && !(obs[it.id] ?? "").trim())
          return `Observação obrigatória em "${it.texto}".`;
        if (it.obriga_foto_quando_nao && naoConforme && !(fotos[it.id] ?? ""))
          return `Foto obrigatória em "${it.texto}".`;
      }
    }
    return null;
  }

  function irRevisar() {
    const p = pendencia();
    if (p) return setErro(p);
    setErro(null);
    setRevisando(true);
    window.scrollTo({ top: 0 });
  }

  async function enviar() {
    if (!assinada) return setErro("Assine para enviar o formulário.");
    setErro(null);
    setEnviando(true);
    const itens = form.formulario_secoes.flatMap((s) =>
      s.formulario_itens.map((it) => ({
        item_id: it.id,
        valor: valores[it.id] ?? "",
        observacao: obs[it.id] ?? "",
        foto_url: fotos[it.id] ?? "",
      })),
    );
    const supabase = createClient();
    const { error } = await supabase.rpc("enviar_resposta", {
      p_formulario: form.id,
      p_itens: itens,
      p_assinatura: assinada,
    });
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }
    router.push(`/app/rede/${redeMembroId}?enviado=1`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <button
          onClick={() =>
            revisando
              ? setRevisando(false)
              : router.push(`/app/rede/${redeMembroId}`)
          }
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{form.nome}</p>
          <p className="truncate text-xs text-muted-foreground">
            {revisando
              ? "Revisão final"
              : total > 1
                ? `Etapa ${idx + 1} de ${total}`
                : form.descricao || "Checklist"}
          </p>
        </div>
      </header>

      {/* progresso das etapas */}
      {!revisando && total > 1 && (
        <div className="flex gap-1 px-4 pt-3">
          {etapas.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      )}

      <div className="flex-1 space-y-5 p-4">
        {revisando ? (
          <RevisaoBody form={form} valores={valores} obs={obs} fotos={fotos} />
        ) : (
          etapas[idx]?.map((s) => (
            <div key={s.id} className="space-y-3">
              {s.titulo && (
                <h2 className="text-sm font-semibold text-foreground">{s.titulo}</h2>
              )}
              {s.formulario_itens.map((it) => (
                <div key={it.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-sm font-medium">{it.texto}</p>
                  {it.ajuda && (
                    <p className="mb-2 text-xs text-muted-foreground">{it.ajuda}</p>
                  )}
                  <ItemInput
                    item={it}
                    valor={valores[it.id] ?? ""}
                    onValor={(v) => setVal(it.id, v)}
                    permiteNa={s.permite_na}
                  />
                  {it.obriga_obs_quando_nao &&
                    ["nao", "ruptura"].includes(valores[it.id] ?? "") && (
                      <input
                        value={obs[it.id] ?? ""}
                        onChange={(e) => setObs((p) => ({ ...p, [it.id]: e.target.value }))}
                        placeholder="Observação (obrigatória)"
                        className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    )}
                  {(it.tipo === "foto" ||
                    (it.obriga_foto_quando_nao &&
                      ["nao", "ruptura"].includes(valores[it.id] ?? ""))) && (
                    <FotoCampo
                      value={fotos[it.id] ?? ""}
                      onChange={(url) => setFotos((p) => ({ ...p, [it.id]: url }))}
                    />
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* Assinatura — só na revisão final */}
        {revisando && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <PenLine className="h-4 w-4" /> Assinatura
            </p>
            {assinada ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assinada} alt="Assinatura" className="h-20 rounded-lg border border-border bg-white object-contain" />
                <button
                  type="button"
                  onClick={() => setAssinada(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Refazer
                </button>
              </div>
            ) : assinatura ? (
              <Button onClick={() => setAssinada(assinatura)} className="w-full">
                <PenLine className="h-4 w-4" /> Assinar
              </Button>
            ) : (
              <SignaturePad label="Assine aqui" onChange={setAssinada} />
            )}
          </div>
        )}

        {erro && (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        )}
      </div>

      {/* barra fixa: navegação por etapas / confirmação final */}
      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4">
        {revisando ? (
          <>
            <Button variant="outline" onClick={() => setRevisando(false)} className="flex-none">
              <ArrowLeft className="h-4 w-4" /> Editar
            </Button>
            <Button onClick={enviar} disabled={enviando} size="lg" className="flex-1">
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar e enviar
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {idx > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setErro(null);
                  setEtapa(idx - 1);
                  window.scrollTo({ top: 0 });
                }}
                className="flex-none"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            {ultima ? (
              <Button onClick={irRevisar} size="lg" className="flex-1">
                <ClipboardCheck className="h-4 w-4" /> Revisar e enviar
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setErro(null);
                  setEtapa(idx + 1);
                  window.scrollTo({ top: 0 });
                }}
                size="lg"
                className="flex-1"
              >
                Próxima <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Revisão final: todos os campos preenchidos, observações e fotos (somente leitura).
function RevisaoBody({
  form,
  valores,
  obs,
  fotos,
}: {
  form: FormData;
  valores: Record<string, string>;
  obs: Record<string, string>;
  fotos: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
        <ClipboardCheck className="h-4 w-4 shrink-0" /> Confira tudo antes de
        confirmar o envio.
      </div>
      {form.formulario_secoes.map((s) => (
        <div key={s.id} className="space-y-2">
          {s.titulo && <h2 className="text-sm font-semibold">{s.titulo}</h2>}
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {s.formulario_itens.map((it) => {
              const v = valores[it.id] ?? "";
              const ob = (obs[it.id] ?? "").trim();
              const fo = fotos[it.id] ?? "";
              const naoConforme = ["nao", "ruptura"].includes(v);
              return (
                <div key={it.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm">{it.texto}</p>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        naoConforme
                          ? "text-danger"
                          : v
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {it.tipo === "foto" ? (fo ? "Foto" : "—") : rotuloValor(it, v)}
                    </span>
                  </div>
                  {ob && (
                    <p className="mt-1 text-xs text-muted-foreground">Obs: {ob}</p>
                  )}
                  {fo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fo}
                      alt=""
                      className="mt-2 h-20 w-20 rounded-lg border border-border object-cover"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemInput({
  item,
  valor,
  onValor,
  permiteNa,
}: {
  item: Item;
  valor: string;
  onValor: (v: string) => void;
  permiteNa: boolean;
}) {
  const pares = PARES[item.tipo];
  if (pares) {
    return (
      <div className="flex flex-wrap gap-2">
        {pares.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => onValor(v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              valor === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
        {permiteNa && (
          <button
            type="button"
            onClick={() => onValor("na")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              valor === "na" ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
            }`}
          >
            N/A
          </button>
        )}
      </div>
    );
  }

  if (item.tipo === "multipla_escolha") {
    return (
      <div className="flex flex-col gap-1.5">
        {(item.opcoes ?? []).map((op) => (
          <label key={op} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={item.id}
              checked={valor === op}
              onChange={() => onValor(op)}
              className="h-4 w-4 accent-primary"
            />
            {op}
          </label>
        ))}
      </div>
    );
  }

  // foto é renderizada pelo FotoCampo (fora do ItemInput)
  if (item.tipo === "foto") return null;

  const tipoInput =
    item.tipo === "numero" ? "number" : item.tipo === "data" ? "date" : "text";
  return (
    <input
      type={tipoInput}
      value={valor}
      onChange={(e) => onValor(e.target.value)}
      placeholder="Resposta"
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function FotoCampo({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubindo(true);
    const supabase = createClient();
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("respostas-fotos").upload(path, f);
    if (!up.error) {
      onChange(supabase.storage.from("respostas-fotos").getPublicUrl(path).data.publicUrl);
    }
    setSubindo(false);
  }

  return (
    <div className="mt-2">
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={subindo}
          className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {subindo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Tirar foto
            </>
          )}
        </button>
      )}
    </div>
  );
}
