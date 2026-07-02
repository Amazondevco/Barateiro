"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, BellRing, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { resolverSugestao, escalarSugestao } from "@/lib/sugestao-actions";
import { AudioPlayer } from "./audio-player";

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeiras = partes.slice(0, 2).map((p) => p[0]);
  return primeiras.join("").toUpperCase();
}

export function SugestaoCard({
  id,
  autor,
  texto,
  audioUrl,
  status,
  criadoEm,
  podeEscalar = false,
}: {
  id: string;
  autor: string;
  texto: string;
  audioUrl: string | null;
  status: string;
  criadoEm: string;
  podeEscalar?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [escalando, startEscalar] = useTransition();
  const [escalada, setEscalada] = useState(false);
  const [recebida, setRecebida] = useState(status === "resolvida");
  const [aviso, setAviso] = useState<{ notificado: boolean } | null>(null);
  const toast = useToast();

  const data = new Date(criadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function alternar() {
    const marcandoRecebida = !recebida;
    startTransition(async () => {
      const r = await resolverSugestao(id, marcandoRecebida);
      if (!r.ok) {
        toast.error("Não foi possível atualizar a sugestão.");
        return;
      }
      setRecebida(marcandoRecebida);
      if (marcandoRecebida) {
        setAviso({ notificado: r.notificado });
      } else {
        toast.info("Sugestão reaberta.");
      }
      router.refresh();
    });
  }

  function escalar() {
    startEscalar(async () => {
      const r = await escalarSugestao(id);
      if (!r.ok) {
        toast.error(r.error ?? "Não foi possível enviar ao Check.AI.");
        return;
      }
      setEscalada(true);
      toast.success("Sugestão enviada ao Check.AI.");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors sm:p-5">
      {/* Cabeçalho: autor + data e status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {iniciaisDe(autor)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {autor}
            </p>
            <p className="text-xs text-muted-foreground">{data}</p>
          </div>
        </div>
        <Badge tone={recebida ? "success" : "warning"}>
          {recebida ? "Recebida" : "Nova"}
        </Badge>
      </div>

      {/* Corpo */}
      {texto && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {texto}
        </p>
      )}

      {audioUrl && (
        <div className="mt-3 max-w-md">
          <AudioPlayer src={audioUrl} />
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {podeEscalar && (
          <Button
            variant="outline"
            size="sm"
            disabled={escalando || escalada}
            onClick={escalar}
            title="Encaminhar esta sugestão para a equipe do Check.AI"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {escalada ? "Enviada ao Check.AI" : "Enviar para Check.AI"}
          </Button>
        )}
        <Button variant="outline" size="sm" disabled={pending} onClick={alternar}>
          {recebida ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reabrir
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Marcar como
              recebida
            </>
          )}
        </Button>
      </div>

      {aviso && (
        <Modal title="Sugestão recebida" onClose={() => setAviso(null)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BellRing className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm">
              {aviso.notificado ? (
                <>
                  Avisamos <strong>{autor}</strong> de que os responsáveis
                  receberam a sugestão e vão avaliar.
                </>
              ) : (
                <>
                  Sugestão marcada como recebida. Não foi possível notificar{" "}
                  <strong>{autor}</strong> (sem app com notificações ativas).
                </>
              )}
            </p>
            <Button size="sm" onClick={() => setAviso(null)}>
              Entendi
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
