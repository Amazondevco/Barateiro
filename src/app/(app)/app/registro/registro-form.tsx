"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Building2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SignaturePad } from "../signature-pad";

export type ConviteInfo = {
  rede_id: string;
  rede_nome: string;
  rede_logo: string | null;
  papel: string;
  exige_aprovacao: boolean;
};

export function RegistroRedeForm({
  token,
  convite,
}: {
  token: string | null;
  convite: ConviteInfo | null;
}) {
  const router = useRouter();
  const [assina1, setAssina1] = useState<string | null>(null);
  const [assina2, setAssina2] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    if (!assina1 || !assina2) return setErro("Faça a assinatura nos dois campos.");
    if (!consent) return setErro("Confirme a ciência sobre a assinatura.");
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("usar_convite", {
      p_token: token,
      p_assinatura: assina2,
      p_consent: consent,
    });
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }
    router.push("/app");
  }

  // Convite inválido / ausente → tela de aviso (sem spinner).
  if (!token || !convite) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <h1 className="text-lg font-semibold">Convite inválido</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Use o link de convite que o gestor da sua rede enviar.
        </p>
        <Link href="/app" className="mt-2 text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-5 flex items-center gap-3">
        {convite.rede_logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={convite.rede_logo}
            alt={convite.rede_nome}
            className="h-10 w-10 shrink-0 rounded-xl object-contain"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold leading-tight">Entrar na rede</p>
          <p className="text-xs text-muted-foreground">{convite.rede_nome}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Crie sua assinatura eletrônica. Ela ficará registrada em todos os
        checklists que você preencher nesta rede.
      </p>

      <div className="space-y-4">
        <SignaturePad label="Assine aqui" onChange={setAssina1} />
        <SignaturePad label="Confirme assinando novamente" onChange={setAssina2} />

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            Entendo que esta assinatura tem validade de confirmação de que fui eu
            quem assinei, e ficará registrada em todos os checklists que eu
            preencher.
          </span>
        </label>
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
      )}

      <div className="mt-5">
        <Button onClick={entrar} disabled={enviando} className="w-full" size="lg">
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Entrar na rede
            </>
          )}
        </Button>
        {convite.exige_aprovacao && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Seu acesso ficará pendente até o gestor aprovar.
          </p>
        )}
      </div>
    </div>
  );
}
