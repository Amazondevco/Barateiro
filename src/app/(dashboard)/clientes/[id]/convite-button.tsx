"use client";

import { useState, useTransition } from "react";
import { Loader2, Link2, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convidarResponsavel } from "../actions";

// Gera o link de convite/cadastro do responsável da rede e mostra com botão de
// copiar (para enviar manualmente enquanto o e-mail não sai). Pode gerar de novo
// a qualquer momento — links expiram, então prefira gerar um novo na hora de enviar.
export function ConviteResponsavelButton({
  redeId,
  email,
  linkInicial = null,
}: {
  redeId: string;
  email: string | null;
  linkInicial?: string | null;
}) {
  const [link, setLink] = useState<string | null>(linkInicial);
  const [copiado, setCopiado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!email) return null;

  function gerar() {
    setMsg(null);
    start(async () => {
      const r = await convidarResponsavel(redeId);
      if (r.ok && r.link) {
        setLink(r.link);
        setCopiado(false);
        setMsg({
          ok: true,
          text: r.emailEnviado
            ? `Link gerado e e-mail enviado para ${r.email}.`
            : "Link gerado. Copie e envie ao responsável.",
        });
      } else {
        setMsg({ ok: false, text: r.error ?? "Falha ao gerar o link." });
      }
    });
  }

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={gerar}
          disabled={pending}
          title={`Gerar link de convite para ${email}`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : link ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {link ? "Gerar novo link" : "Gerar link de convite"}
        </Button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
            {msg.text}
          </span>
        )}
      </div>

      {link && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 flex-1 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground outline-none"
            />
            <Button type="button" size="sm" onClick={copiar}>
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Envie este link ao responsável (WhatsApp, etc.). Links expiram — se passar
            muito tempo, gere um novo antes de enviar.
          </p>
        </div>
      )}
    </div>
  );
}
