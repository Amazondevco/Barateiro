"use client";

import { Check, X } from "lucide-react";
import { criteriosSenha } from "@/lib/senha";
import { cn } from "@/lib/utils";

// Lista de critérios da senha que dá feedback AO VIVO enquanto o usuário digita:
// cada linha vira verde com ✓ quando cumprida e vermelha com ✕ quando falta.
// Antes de digitar (campo vazio) fica neutro — minimalista, sem "susto" de tudo
// vermelho. Reutilizada no cadastro e na definição/redefinição de senha.
export function SenhaCriterios({
  senha,
  className,
}: {
  senha: string;
  className?: string;
}) {
  const criterios = criteriosSenha(senha);
  const ativo = senha.length > 0;

  return (
    <ul className={cn("mt-2 space-y-1.5", className)}>
      {criterios.map((c) => {
        const estado = !ativo ? "neutro" : c.ok ? "ok" : "falta";
        return (
          <li
            key={c.texto}
            className="flex items-center gap-2 text-xs font-medium"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                estado === "ok" && "bg-success-bg text-success",
                estado === "falta" && "bg-danger-bg text-danger",
                estado === "neutro" && "bg-muted text-muted-foreground",
              )}
            >
              {estado === "ok" ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : estado === "falta" ? (
                <X className="h-3 w-3" strokeWidth={3} />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>
            <span
              className={cn(
                "transition-colors",
                estado === "ok" && "text-success",
                estado === "falta" && "text-danger",
                estado === "neutro" && "text-muted-foreground",
              )}
            >
              {c.texto}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
