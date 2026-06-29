"use client";

import { useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const resolvida = status === "resolvida";

  const data = new Date(criadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolverSugestao(id, !resolvida);
            })
          }
        >
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
    </div>
  );
}
