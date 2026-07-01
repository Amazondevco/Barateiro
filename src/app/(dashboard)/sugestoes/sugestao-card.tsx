"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, BellRing, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { resolverSugestao, escalarSugestao } from "@/lib/sugestao-actions";

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
  const [pending, startTransition] = useTransition();
  const [escalando, startEscalar] = useTransition();
  const [escalada, setEscalada] = useState(false);
  const [aviso, setAviso] = useState<{ notificado: boolean } | null>(null);
  const toast = useToast();
  const recebida = status === "resolvida"; // valor no banco continua 'resolvida'

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
      if (marcandoRecebida) {
        setAviso({ notificado: r.notificado }); // pop-up de confirmação
      } else {
        toast.info("Sugestão reaberta.");
      }
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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{autor}</span>
          <span className="text-xs text-muted-foreground">{data}</span>
        </div>
        <Badge tone={recebida ? "success" : "primary"}>
          {recebida ? "Recebida" : "Nova"}
        </Badge>
      </div>

      {texto && <p className="whitespace-pre-wrap text-sm">{texto}</p>}

      {audioUrl && (
        <audio src={audioUrl} controls className="mt-2 h-9 w-full max-w-sm" />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {podeEscalar && (
          <Button
            variant="outline"
            size="sm"
            disabled={escalando || escalada}
            onClick={escalar}
            title="Encaminhar esta sugestão para a equipe do Check.AI"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {escalada ? "Enviada ao Check.AI" : "Enviar para Check.AI"}
          </Button>
        )}
        <Button variant="outline" size="sm" disabled={pending} onClick={alternar}>
          {recebida ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" /> Reabrir
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Marcar como recebida
            </>
          )}
        </Button>
      </div>

      {aviso && (
        <Modal title="Sugestão recebida" onClose={() => setAviso(null)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BellRing className="h-6 w-6" />
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
