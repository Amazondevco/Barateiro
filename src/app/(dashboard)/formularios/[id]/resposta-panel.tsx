"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Eye,
  Clock,
  CircleAlert,
  Calendar,
  Store,
  MapPin,
  Paperclip,
  ZoomIn,
  ZoomOut,
  Download,
  ShoppingBasket,
  Snowflake,
  Apple,
  Beef,
  Croissant,
  Wine,
  Fish,
  Milk,
  Package,
  type LucideIcon,
} from "lucide-react";
import {
  getRespostaDetalhe,
  resumirResposta,
  marcarRespostaLida,
  type RespostaDetalhe,
} from "./resposta-actions";

function valorTone(v: string): "ok" | "nao" | "neutro" {
  const x = v.toLowerCase();
  if (["sim", "ok", "abastecido"].includes(x)) return "ok";
  if (["não", "nao", "ruptura"].includes(x)) return "nao";
  return "neutro";
}

// Ícone da seção a partir do título (texto livre). Sem match → ícone padrão.
function secaoIcon(titulo: string): LucideIcon {
  const t = titulo.toLowerCase();
  if (/(frio|latic|resfri|congel)/.test(t)) return Snowflake;
  if (/(mercearia|seco)/.test(t)) return ShoppingBasket;
  if (/(horti|fruta|verdura|flv|legume)/.test(t)) return Apple;
  if (/(açougue|acougue|carne)/.test(t)) return Beef;
  if (/(padaria|pão|pães|confeit)/.test(t)) return Croissant;
  if (/(bebida|adega|vinho)/.test(t)) return Wine;
  if (/(peixe|pescado|frutos do mar)/.test(t)) return Fish;
  if (/(leite|iogurte)/.test(t)) return Milk;
  return Package;
}

function fileNameFromUrl(url: string): string {
  try {
    const last = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
    return last || "Foto anexada";
  } catch {
    return "Foto anexada";
  }
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  const a = partes[0][0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] ?? "" : "";
  return (a + b).toUpperCase();
}

export function RespostaPanel({
  id,
  onClose,
  onRead,
}: {
  id: string;
  onClose: () => void;
  onRead?: (id: string) => void;
}) {
  const [det, setDet] = useState<RespostaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState<string | null>(null);
  const [resumindo, setResumindo] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [lida, setLida] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setResumo(null);
    setLida(false);
    getRespostaDetalhe(id).then((d) => {
      setDet(d);
      setCarregando(false);
      if (d) {
        setLida(d.lida);
        // Abrir = ler: marca no servidor e avisa a lista (otimista).
        onRead?.(id);
        void marcarRespostaLida(id).then(() => setLida(true));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function resumir() {
    setResumindo(true);
    const { resumo } = await resumirResposta(id);
    setResumo(resumo);
    setResumindo(false);
  }

  const data = det
    ? new Date(det.data).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-3xl flex-col overflow-hidden bg-card shadow-2xl sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-3xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 sm:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {det?.formulario ?? "Carregando…"}
              </h2>
              {lida && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> Lido pelo admin
                </span>
              )}
            </div>
            {det && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {data}
                </span>
                {det.unidade && (
                  <>
                    <span className="text-border">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Store className="h-4 w-4" /> {det.unidade}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
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
          <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8 sm:px-8">
            {/* Resumo / ações */}
            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold ${
                    det.total_nao > 0 ? "text-danger" : "text-success"
                  }`}
                >
                  <CircleAlert className="h-4 w-4" />
                  {det.total_nao > 0
                    ? `${det.total_nao} Não-conformidade${det.total_nao > 1 ? "s" : ""}`
                    : "Tudo conforme"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold ${
                    det.status === "no_prazo" ? "text-success" : "text-warning"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  {det.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
                </span>
                {det.presenca_ok === false && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-danger">
                    <MapPin className="h-4 w-4" /> Fora do local
                  </span>
                )}
                {det.presenca_ok === true && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-success">
                    <MapPin className="h-4 w-4" /> No local
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm font-medium text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {iniciais(det.autor)}
                  </span>
                  Por {det.autor}
                </span>
              </div>

              {resumo ? (
                <div className="rounded-xl border border-ia/30 bg-ia/5 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ia">
                    <Sparkles className="h-3.5 w-3.5" /> Resumo da IA
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {resumo}
                  </p>
                </div>
              ) : (
                <button
                  onClick={resumir}
                  disabled={resumindo}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-ia to-ia-strong px-4 py-2.5 text-sm font-semibold text-ia-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {resumindo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Resumindo…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Resumir com IA
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Itens por seção */}
            {det.secoes.map((s, si) => {
              const Icon = secaoIcon(s.titulo ?? "");
              return (
                <div key={si} className="space-y-3">
                  {s.titulo && (
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {s.titulo}
                      </h3>
                    </div>
                  )}
                  <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                    {s.itens.map((it, ii) => {
                      const tone = valorTone(it.valor);
                      const temAnexo = !!it.foto_url || !!it.observacao;
                      return (
                        <div key={ii} className="p-4 sm:px-5">
                          <div className="flex items-center justify-between gap-4">
                            <p className="min-w-0 text-[15px] font-medium text-foreground">
                              {it.texto}
                            </p>
                            <span
                              className={`shrink-0 rounded-lg px-3 py-1 text-sm font-semibold ${
                                tone === "ok"
                                  ? "bg-success-bg text-success"
                                  : tone === "nao"
                                    ? "bg-danger-bg text-danger"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {it.valor}
                            </span>
                          </div>

                          {temAnexo && (
                            <div className="mt-3 flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
                              {it.foto_url ? (
                                <button
                                  type="button"
                                  onClick={() => setFoto(it.foto_url)}
                                  className="shrink-0"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={it.foto_url}
                                    alt=""
                                    className="h-11 w-11 rounded-lg border border-border object-cover"
                                  />
                                </button>
                              ) : (
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <Paperclip className="h-4 w-4" />
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                {it.foto_url && (
                                  <button
                                    type="button"
                                    onClick={() => setFoto(it.foto_url)}
                                    className="block truncate text-sm font-medium text-foreground hover:text-primary"
                                  >
                                    {fileNameFromUrl(it.foto_url)}
                                  </button>
                                )}
                                {it.observacao && (
                                  <p className="text-sm text-muted-foreground">
                                    {it.observacao}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {det.assinatura && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Assinatura
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={det.assinatura}
                  alt="Assinatura"
                  className="h-20 rounded-lg border border-border bg-white object-contain"
                />
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
