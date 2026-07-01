"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/toast";
import { resolverSugestao } from "@/lib/sugestao-actions";

export function SugestaoCard({
  id,
  autor,
  texto,
  audioUrl,
  status,
  criadoEm,
}: {
  id: string;
  autor: string;
  texto: string;
  audioUrl: string | null;
  status: string;
  criadoEm: string;
}) {
  const [pending, startTransition] = useTransition();
  const [aviso, setAviso] = useState<{ notificado: boolean } | null>(null);
  const toast = useToast();
  const resolvida = status === "resolvida";

  const data = new Date(criadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function alternar() {
    const marcandoResolvida = !resolvida;
    startTransition(async () => {
      const r = await resolverSugestao(id, marcandoResolvida);
      if (!r.ok) {
        toast.error("Não foi possível atualizar a sugestão.");
        return;
      }
      if (marcandoResolvida) {
        setAviso({ notificado: r.notificado }); // abre o pop-up de confirmação
      } else {
        toast.info("Sugestão reaberta.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{autor}</span>
          <span className="text-xs text-muted-foreground">{data}</span>
        </div>
        <Badge tone={resolvida ? "success" : "primary"}>
          {resolvida ? "Resolvida" : "Nova"}
        </Badge>
      </div>

      {texto && <p className="whitespace-pre-wrap text-sm">{texto}</p>}

      {audioUrl && (
        <audio src={audioUrl} controls className="mt-2 h-9 w-full max-w-sm" />
      )}

      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" disabled={pending} onClick={alternar}>
          {resolvida ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" /> Reabrir
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Marcar como resolvida
            </>
          )}
        </Button>
      </div>

      {aviso && (
        <Modal title="Sugestão resolvida" onClose={() => setAviso(null)}>
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
                  Sugestão marcada como resolvida. Não foi possível notificar{" "}
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
