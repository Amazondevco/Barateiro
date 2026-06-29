"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convidarResponsavel } from "../actions";

// Reenvia o convite de cadastro ao responsável (contato) da rede.
export function ConviteResponsavelButton({
  redeId,
  email,
}: {
  redeId: string;
  email: string | null;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!email) return null;

  function enviar() {
    setMsg(null);
    start(async () => {
      const r = await convidarResponsavel(redeId);
      setMsg(
        r.ok
          ? { ok: true, text: `Convite enviado para ${r.email}.` }
          : { ok: false, text: r.error ?? "Falha ao enviar." },
      );
    });
  }

  return (
    <div className="flex items-center gap-3">
      {msg && (
        <span className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={enviar}
        disabled={pending}
        title={`Enviar convite para ${email}`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Reenviar convite
      </Button>
    </div>
  );
}
