"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Loader2,
  PenLine,
  Camera,
  Trash2,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { enqueueSubmission } from "@/lib/offline-db";
import { sincronizar, pendingCount, comprimirFoto } from "@/lib/offline-sync";
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
        fotoDataUrl: fotos[it.id] || undefined,
      })),
    );
    try {
      // Entra na fila local → funciona offline. A sincronização envia agora
      // (se online) ou quando a conexão voltar.
      await enqueueSubmission({
        membroId: redeMembroId,
        formId: form.id,
        formNome: form.nome,
        itens,
        assinatura: assinada,
        criadoEm: new Date().toISOString(),
        tentativas: 0,
      });
      await sincronizar();
      const restante = await pendingCount();
      router.push(
        `/app/rede/${redeMembroId}?${restante > 0 ? "pendente" : "enviado"}=1`,
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar o envio.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/95 p-4 backdrop-blur">
        <button
          onClick={() =>
            revisando
              ? setRevisando(false)
              : router.push(`/app/rede/${redeMembroId}`)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight text-foreground">
            {form.nome}
          </h1>
          <p className="truncate text-[13px] font-medium text-muted-foreground">
            {revisando
              ? "Revisão final"
              : total > 1
                ? `Etapa ${idx + 1} de ${total}`
                : form.descricao || "Checklist"}
          </p>
        </div>
      </header>

      {/* progresso das etapas — segmentos */}
      {!revisando && total > 1 && (
        <div className="flex gap-1 border-b border-border bg-card/95 px-5 pb-4 pt-3 backdrop-blur">
          {etapas.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < idx ? "bg-primary/50" : i === idx ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex-1 space-y-4 p-5 pb-[120px]">
        {revisando ? (
          <RevisaoBody form={form} valores={valores} obs={obs} fotos={fotos} />
        ) : (
          etapas[idx]?.map((s) => (
            <div key={s.id} className="space-y-4">
              {s.titulo && (
                <h2 className="mt-2 text-lg font-bold text-foreground">{s.titulo}</h2>
              )}
              {s.formulario_itens.map((it) => (
                <div
                  key={it.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <p className="text-[15px] font-semibold leading-snug text-foreground">
                    {it.texto}
                  </p>
                  {it.ajuda && (
                    <p className="mt-1 text-xs text-muted-foreground">{it.ajuda}</p>
                  )}
                  <ItemInput
                    item={it}
                    valor={valores[it.id] ?? ""}
                    onValor={(v) => setVal(it.id, v)}
                    permiteNa={s.permite_na}
                  />
                  {(() => {
                    const naoConforme = ["nao", "ruptura"].includes(
                      valores[it.id] ?? "",
                    );
                    const mostraObs = it.obriga_obs_quando_nao && naoConforme;
                    const mostraFoto =
                      it.tipo === "foto" ||
                      (it.obriga_foto_quando_nao && naoConforme);
                    if (!mostraObs && !mostraFoto) return null;
                    // Expansão contextual: foto + observação quando "Não".
                    const contextual = naoConforme && (mostraObs || mostraFoto);
                    return (
                      <div
                        className={`mt-4 flex flex-col gap-3 ${
                          contextual
                            ? "rounded-xl border border-danger/20 bg-danger-bg/40 p-3"
                            : ""
                        }`}
                      >
                        {mostraFoto && (
                          <FotoCampo
                            value={fotos[it.id] ?? ""}
                            onChange={(url) =>
                              setFotos((p) => ({ ...p, [it.id]: url }))
                            }
                            danger={contextual}
                          />
                        )}
                        {mostraObs && (
                          <input
                            value={obs[it.id] ?? ""}
                            onChange={(e) =>
                              setObs((p) => ({ ...p, [it.id]: e.target.value }))
                            }
                            placeholder="Adicionar observação…"
                            className="h-9 w-full rounded-lg border border-danger/20 bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          ))
        )}

        {/* Assinatura — só na revisão final */}
        {revisando && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <PenLine className="h-4 w-4 text-primary" /> Assinatura
            </p>
            {assinada ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assinada} alt="Assinatura" className="h-20 rounded-xl border border-border bg-white object-contain" />
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
          <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        )}
      </div>

      {/* rodapé fixo: navegação por etapas / confirmação final */}
      <div className="sticky bottom-0 flex gap-3 border-t border-border bg-card/95 p-5 pb-8 backdrop-blur">
        {revisando ? (
          <>
            <Button
              variant="secondary"
              onClick={() => setRevisando(false)}
              className="h-14 flex-none rounded-2xl px-5"
            >
              <ArrowLeft className="h-4 w-4" /> Editar
            </Button>
            <Button
              onClick={enviar}
              disabled={enviando}
              className="h-14 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" /> Confirmar e enviar
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {idx > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setErro(null);
                  setEtapa(idx - 1);
                  window.scrollTo({ top: 0 });
                }}
                className="h-14 flex-none rounded-2xl px-5"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            {ultima ? (
              <Button
                onClick={irRevisar}
                className="h-14 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
              >
                <ClipboardCheck className="h-5 w-5" /> Revisar e enviar
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setErro(null);
                  setEtapa(idx + 1);
                  window.scrollTo({ top: 0 });
                }}
                className="h-14 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
              >
                Próxima <ArrowRight className="h-5 w-5" />
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
    <div className="space-y-6">
      {/* banner "Quase lá!" */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div>
          <h3 className="mb-0.5 text-sm font-bold text-foreground">Quase lá!</h3>
          <p className="text-[13px] leading-snug text-muted-foreground">
            Confira suas respostas abaixo antes de confirmar o envio definitivo.
          </p>
        </div>
      </div>

      {form.formulario_secoes.map((s) => (
        <div key={s.id} className="space-y-3">
          {s.titulo && (
            <h2 className="px-1 text-[15px] font-bold uppercase tracking-wide text-foreground">
              {s.titulo}
            </h2>
          )}
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {s.formulario_itens.map((it) => {
              const v = valores[it.id] ?? "";
              const ob = (obs[it.id] ?? "").trim();
              const fo = fotos[it.id] ?? "";
              const naoConforme = ["nao", "ruptura"].includes(v);
              const conforme = ["sim", "ok", "abastecido"].includes(v);
              const ehFoto = it.tipo === "foto";
              const badgeClasse = naoConforme
                ? "bg-danger-bg text-danger"
                : conforme
                  ? "bg-success-bg text-success"
                  : "bg-muted text-muted-foreground";
              return (
                <div key={it.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {it.texto}
                    </p>
                    {fo && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        <Camera className="h-3 w-3" /> 1 foto anexada
                      </span>
                    )}
                    {ob && (
                      <p className="mt-1 text-xs text-muted-foreground">Obs: {ob}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClasse}`}
                  >
                    {ehFoto ? (fo ? "Foto" : "—") : rotuloValor(it, v)}
                  </span>
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
      <div className="mt-4 flex gap-2">
        {pares.map(([v, label]) => {
          const selecionado = valor === v;
          // Conforme → verde; não-conforme → vermelho.
          const conforme = ["sim", "ok", "abastecido"].includes(v);
          const selClasse = conforme
            ? "border-success bg-success-bg text-success"
            : "border-danger bg-danger-bg text-danger";
          return (
            <button
              key={v}
              type="button"
              onClick={() => onValor(v)}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                selecionado
                  ? `${selClasse} font-semibold`
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {selecionado &&
                (conforme ? (
                  <Check className="mr-1.5 h-4 w-4 opacity-70" />
                ) : (
                  <X className="mr-1.5 h-4 w-4 opacity-70" />
                ))}
              {label}
            </button>
          );
        })}
        {permiteNa && (
          <button
            type="button"
            onClick={() => onValor("na")}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
              valor === "na"
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
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
      <div className="mt-4 flex flex-col gap-1.5">
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
      className="mt-4 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function FotoCampo({
  value,
  onChange,
  danger = false,
}: {
  value: string;
  onChange: (url: string) => void;
  danger?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubindo(true);
    try {
      // Guarda a foto localmente (comprimida). O upload acontece na
      // sincronização → tirar foto funciona mesmo offline.
      onChange(await comprimirFoto(f));
    } catch {
      /* ignore */
    } finally {
      setSubindo(false);
    }
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" />
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={subindo}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
            danger
              ? "border-danger/20 bg-card text-danger hover:bg-danger-bg/60"
              : "border-input text-foreground hover:bg-muted"
          }`}
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
