"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { listOutbox, type OutboxSubmission } from "@/lib/offline-db";
import { onOutboxChange } from "@/lib/offline-sync";

// Envios na fila local (offline ou aguardando sincronização).
export function PendingEnviados() {
  const [subs, setSubs] = useState<OutboxSubmission[]>([]);

  useEffect(() => {
    let vivo = true;
    const refresh = () =>
      listOutbox()
        .then((s) => vivo && setSubs(s))
        .catch(() => {});
    refresh();
    const off = onOutboxChange(refresh);
    return () => {
      vivo = false;
      off();
    };
  }, []);

  if (!subs.length) return null;

  return (
    <div className="mb-4 space-y-2">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Aguardando envio
      </p>
      {subs.map((s) => {
        const d = new Date(s.criadoEm).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const falhou = !!s.erro && (s.tentativas ?? 0) > 1;
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning-bg/40 p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.formNome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {d} · {falhou ? "tentando reenviar…" : "será enviado ao reconectar"}
              </p>
            </div>
            {falhou && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            )}
          </div>
        );
      })}
    </div>
  );
}
