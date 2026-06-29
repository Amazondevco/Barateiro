"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getRespostaDetalhe,
  resumirResposta,
  type RespostaDetalhe,
} from "./resposta-actions";

export function RespostaPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [det, setDet] = useState<RespostaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState<string | null>(null);
  const [resumindo, setResumindo] = useState(false);

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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-card shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{det?.formulario ?? "Carregando…"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {data}
              {det?.unidade ? ` · ${det.unidade}` : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
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
            {/* metadados */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={det.status === "no_prazo" ? "success" : "warning"}>
                {det.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
              </Badge>
              <Badge tone={det.total_nao > 0 ? "danger" : "success"}>
                {det.total_nao} não-conformidade(s)
              </Badge>
              <span className="text-sm text-muted-foreground">Por {det.autor}</span>
            </div>

            {/* resumo IA */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              {resumo ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{resumo}</p>
              ) : (
                <button
                  onClick={resumir}
                  disabled={resumindo}
                  className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-60"
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

            {/* CAMPO / DADOS */}
            <div>
              <p className="mb-2 text-sm font-semibold">Formulário</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[1fr_1fr] bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="px-3 py-2">Campo</span>
                  <span className="px-3 py-2">Dados</span>
                </div>
                {det.secoes.map((s, si) => (
                  <div key={si}>
                    {s.titulo && (
                      <p className="bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground">
                        {s.titulo}
                      </p>
                    )}
                    {s.itens.map((it, ii) => {
                      const neg = ["não", "ruptura"].includes(it.valor.toLowerCase());
                      return (
                        <div key={ii} className="grid grid-cols-[1fr_1fr] border-t border-border text-sm">
                          <span className="px-3 py-2 text-muted-foreground">{it.texto}</span>
                          <span className="px-3 py-2">
                            <span className={neg ? "font-medium text-danger" : "font-medium"}>{it.valor}</span>
                            {it.observacao && (
                              <span className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {it.observacao}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* assinatura */}
            {det.assinatura && (
              <div>
                <p className="mb-2 text-sm font-semibold">Assinatura</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={det.assinatura} alt="Assinatura" className="h-20 rounded-lg border border-border bg-white object-contain" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
