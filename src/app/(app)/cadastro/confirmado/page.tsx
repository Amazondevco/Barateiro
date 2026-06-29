import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Conta confirmada — Barateiro" };

export default function ConfirmadoPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-bg text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="text-lg font-semibold">E-mail confirmado!</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Sua conta está ativa. O próximo passo é entrar na sua rede pelo link ou
        convite que o gestor enviar.
      </p>
      <Link
        href="/login"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Entrar
      </Link>
    </div>
  );
}
