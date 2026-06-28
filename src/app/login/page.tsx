import { Brand } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar — Amazon Dev & Co." };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Painel de marca (lado esquerdo, escuro) */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <Brand onDark />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Gestão diária da sua rede, no controle.
          </h1>
          <p className="max-w-md text-sidebar-foreground">
            Checklists, conformidade e relatórios das suas lojas em um só lugar.
            Acompanhe tudo em tempo real.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">
          © {new Date().getFullYear()} Amazon Dev & Co. · Gestão para redes de
          supermercado
        </p>
      </div>

      {/* Formulário (lado direito) */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Bem-vindo de volta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>
          <Card>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
