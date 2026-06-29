"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SignaturePad } from "../../../signature-pad";

export function AssinarForm({
  membroId,
  redeNome,
}: {
  membroId: string;
  redeNome: string;
}) {
  const router = useRouter();
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!a1 || !a2) return setErro("Assine nos dois campos.");
    if (!consent) return setErro("Confirme a ciência sobre a assinatura.");
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("adotar_assinatura", {
      p_membro: membroId,
      p_assinatura: a2,
      p_consent: consent,
    });
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }
    router.push(`/app/rede/${membroId}`);
  }

  return (
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PenLine className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Sua assinatura</p>
          <p className="text-xs text-muted-foreground">{redeNome}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Antes de começar, crie sua assinatura eletrônica. Ela ficará registrada
        em todos os formulários que você preencher nesta rede.
      </p>

      <div className="space-y-4">
        <SignaturePad label="Assine aqui" onChange={setA1} />
        <SignaturePad label="Confirme assinando novamente" onChange={setA2} />

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            Entendo que esta assinatura tem validade de confirmação de que fui eu
            quem assinei, e ficará registrada em todos os formulários que eu
            preencher.
          </span>
        </label>
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
      )}

      <div className="mt-5">
        <Button onClick={salvar} disabled={enviando} size="lg" className="w-full">
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Confirmar assinatura
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
