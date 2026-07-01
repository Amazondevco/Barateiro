import Link from "next/link";
import { LoginForm } from "./login-form";
import { InviteHashGuard } from "./invite-guard";
import { ClientsCarousel } from "@/components/clients-carousel";

export const metadata = { title: "Entrar — Check.AI" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <InviteHashGuard />
      {/* Formulário (esquerda) */}
      <div className="flex flex-col justify-between bg-background p-8 sm:p-12">
        {/* Logo */}
        <Link href="/login" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/amazondevco-logo.png"
            alt="Check.AI"
            className="h-9 w-9 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">
            Check<span className="text-primary">.AI</span>
          </span>
        </Link>

        {/* Form — alinhado à esquerda, mesma coluna da logo e do footer */}
        <div className="w-full max-w-sm py-10">
          <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acesse o painel da sua rede.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            © Amazon Dev &amp; Co. · {new Date().getFullYear()}
          </p>
          {/* Carrossel de logos (clientes) — decorativo */}
          <div className="-mx-8 sm:-mx-12">
            <ClientsCarousel />
          </div>
        </div>
      </div>

      {/* Painel de marca (direita) — logo em destaque sobre cor */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-[#0f172a] p-12 lg:flex">
        {/* brilho decorativo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-white shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/amazondevco-logo.png"
              alt="Check.AI"
              className="h-28 w-28 object-contain"
            />
          </div>
          <div>
            <p className="text-4xl font-bold text-white">Check.AI</p>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-slate-300">
              Checklists, conformidade e relatórios da sua rede — tudo em um só
              lugar, em tempo real.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
