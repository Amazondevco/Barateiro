"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles, AlertTriangle, ImageIcon, ZoomIn, ZoomOut, Download } from "lucide-react";
import {
  getRespostaDetalhe,
  resumirResposta,
  type RespostaDetalhe,
} from "./resposta-actions";

function valorTone(v: string): "ok" | "nao" | "neutro" {
  const x = v.toLowerCase();
  if (["sim", "ok", "abastecido"].includes(x)) return "ok";
  if (["não", "nao", "ruptura"].includes(x)) return "nao";
  return "neutro";
}

export function RespostaPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [det, setDet] = useState<RespostaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState<string | null>(null);
  const [resumindo, setResumindo] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setResumo(null);
    getRespostaDetalhe(id).then((d) => {
      setDet(d);
      setCarregando(false);
    });
  }, [id]);

  async function resumir() {
    setResumindo(true);
    const { resumo } = await resumirResposta(id);
    setResumo(resumo);
    setResumindo(false);
  }

  const data = det
    ? new Date(det.data).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{det?.formulario ?? "Carregando…"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {data}{det?.unidade ? ` · ${det.unidade}` : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {carregando ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !det ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Não foi possível carregar a resposta.
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* resumo destacado */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${det.total_nao > 0 ? "bg-danger-bg text-danger" : "bg-success-bg text-success"}`}>
                  {det.total_nao} não-conformidade(s)
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {det.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
                </span>
                <span className="text-sm text-muted-foreground">Por {det.autor}</span>
              </div>
              {resumo ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{resumo}</p>
              ) : (
                <button onClick={resumir} disabled={resumindo} className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-60">
                  {resumindo ? <><Loader2 className="h-4 w-4 animate-spin" /> Resumindo…</> : <><Sparkles className="h-4 w-4" /> Resumir com IA</>}
                </button>
              )}
            </div>

            {/* itens por seção */}
            {det.secoes.map((s, si) => (
              <div key={si} className="space-y-2">
                {s.titulo && (
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.titulo}</h3>
                )}
                <div className="space-y-1.5">
                  {s.itens.map((it, ii) => {
                    const tone = valorTone(it.valor);
                    return (
                      <div key={ii} className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-foreground">{it.texto}</p>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              tone === "ok" ? "bg-success-bg text-success"
                              : tone === "nao" ? "bg-danger-bg text-danger"
                              : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {it.valor}
                          </span>
                        </div>
                        {it.observacao && (
                          <p className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {it.observacao}
                          </p>
                        )}
                        {it.foto_url && (
                          <button
                            type="button"
                            onClick={() => setFoto(it.foto_url)}
                            className="mt-2 inline-flex items-center gap-2"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.foto_url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <ImageIcon className="h-3.5 w-3.5" /> ver foto
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {det.assinatura && (
              <div>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assinatura</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={det.assinatura} alt="Assinatura" className="h-20 rounded-lg border border-border bg-white object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {foto && <Lightbox src={foto} onClose={() => setFoto(null)} />}
    </div>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center justify-end gap-1 p-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Diminuir zoom">
          <ZoomOut className="h-5 w-5" />
        </button>
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Aumentar zoom">
          <ZoomIn className="h-5 w-5" />
        </button>
        <a href={src} download target="_blank" rel="noreferrer" className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Baixar">
          <Download className="h-5 w-5" />
        </a>
        <button onClick={onClose} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Fechar">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Foto"
          style={{ transform: `scale(${zoom})` }}
          className="max-h-full max-w-full origin-center object-contain transition-transform"
        />
      </div>
    </div>
  );
}
