import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata = { title: "Confirme seu e-mail — Barateiro" };

export default function ConfirmePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck className="h-8 w-8" />
      </div>
      <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Enviamos um link de confirmação para o seu e-mail. Abra a mensagem e
        toque no link para ativar sua conta.
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Não recebeu? Verifique a caixa de spam ou tente novamente em alguns
        minutos.
      </p>
      <Link href="/login" className="mt-2 text-sm text-primary hover:underline">
        Ir para o login
      </Link>
    </div>
  );
}
