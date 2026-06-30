"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast";

// Ruídos conhecidos que NÃO são erros úteis para o usuário — não viram toast.
const IGNORAR = [
  "ResizeObserver loop", // benigno, browsers disparam à toa
  "Hydration", // avisos de hidratação do React em dev
  "NEXT_REDIRECT", // fluxo normal de redirect do Next, não é erro
  "NEXT_NOT_FOUND",
  "AbortError", // requisições canceladas (navegação)
  "The operation was aborted",
  "Failed to fetch", // rede instável — barulhento; tratamos por ação quando importa
  "Load failed",
];

function ehRuido(msg: string): boolean {
  return IGNORAR.some((p) => msg.includes(p));
}

function mensagemDe(valor: unknown): string {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  if (valor instanceof Error) return valor.message || valor.name;
  if (typeof valor === "object" && "message" in valor) {
    return String((valor as { message: unknown }).message ?? "");
  }
  return String(valor);
}

/**
 * Escuta erros não tratados do sistema e mostra uma notificação de feedback
 * (toast vermelho) automaticamente. Cobre:
 *  - erros de runtime (window "error")
 *  - promises rejeitadas sem catch (window "unhandledrejection")
 *
 * Faz dedupe (não repete a mesma mensagem em sequência) e ignora ruídos
 * conhecidos do browser/Next que não interessam ao usuário.
 *
 * Montar DENTRO do ToastProvider.
 */
export function GlobalErrorToaster() {
  const { error: toastErro } = useToast();
  const ultimo = useRef<{ msg: string; at: number }>({ msg: "", at: 0 });

  // useToast recria a api a cada render; guardamos a fn numa ref para o effect
  // assinar os listeners uma única vez (não re-subscrever a cada render).
  const erroRef = useRef(toastErro);
  erroRef.current = toastErro;

  useEffect(() => {
    function reportar(msg: string) {
      const limpa = msg.trim();
      if (!limpa || ehRuido(limpa)) return;

      // dedupe: mesma mensagem em até 4s não repete
      const agora = Date.now();
      if (limpa === ultimo.current.msg && agora - ultimo.current.at < 4000) {
        return;
      }
      ultimo.current = { msg: limpa, at: agora };

      // mensagens muito longas (stack/JSON) são truncadas para caber no toast
      const texto =
        limpa.length > 160 ? `${limpa.slice(0, 157)}…` : limpa;
      erroRef.current(`Erro: ${texto}`);
    }

    function onError(e: ErrorEvent) {
      reportar(mensagemDe(e.error) || e.message);
    }
    function onRejection(e: PromiseRejectionEvent) {
      reportar(mensagemDe(e.reason));
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
