"use client";

import { useState, useTransition } from "react";
import { Loader2, Link2, Copy, Check, RefreshCw } from "lucide-react";
import { gerarLinkUsuario } from "../../usuarios/actions";

// Link de acesso de UM usuário (recuperação de senha). Gera, copia e guarda.
export function UsuarioLinkButton({
  userId,
  linkInicial = null,
}: {
  userId: string;
  linkInicial?: string | null;
}) {
  const [link, setLink] = useState<string | null>(linkInicial);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function gerar() {
    setErro(null);
    start(async () => {
      const r = await gerarLinkUsuario(userId);
      if (r.ok && r.link) {
        setLink(r.link);
        setCopiado(false);
      } else {
        setErro(r.error ?? "Falha ao gerar.");
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

  if (erro) {
    return <span className="text-xs text-danger">{erro}</span>;
  }

  if (!link) {
    return (
      <button
        type="button"
        onClick={gerar}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        Gerar link
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        title="Copiar link de acesso"
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiado ? "Copiado" : "Copiar link"}
      </button>
      <button
        type="button"
        onClick={gerar}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-input bg-card p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
        title="Gerar novo link"
        aria-label="Gerar novo link"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
