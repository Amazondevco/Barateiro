import Link from "next/link";
import { Check } from "lucide-react";
import { SenhaCriterios } from "@/components/senha-criterios";

export const metadata = { title: "Conta confirmada — Check.AI" };

export default function ConfirmadoPage() {
  return (
    <div className="flex flex-1 flex-col p-8">
      {/* Marca Check.AI — igual à tela de login */}
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/amazondevco-logo.png"
          alt="Check.AI"
          className="h-9 w-9 object-contain"
        />
        <span className="text-xl font-bold tracking-tight">
          Check<span className="text-primary">.AI</span>
        </span>
      </div>

      {/* Conteúdo central */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-success-bg" />
          <span className="absolute inset-2 rounded-full bg-success/15" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/30">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">E-mail confirmado!</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Sua conta está ativa. O próximo passo é entrar na sua rede pelo link
          ou convite que o gestor enviar.
        </p>

        {/* Confirmação de que a senha criada atende aos requisitos */}
        <div className="mt-6 w-full max-w-xs rounded-xl border border-border bg-muted/20 p-4 text-left">
          <p className="text-xs font-semibold text-foreground">
            Senha criada com segurança
          </p>
          <SenhaCriterios senha="" concluido className="mt-2" />
        </div>
      </div>

      {/* Ação */}
      <Link
        href="/login"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Entrar
      </Link>
    </div>
  );
}
