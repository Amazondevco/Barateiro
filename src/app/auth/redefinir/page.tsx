"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Destino dos links de convite (novo responsável de rede) e de recuperação de
// senha. O link do e-mail traz a sessão (hash/token); aqui o usuário define a
// senha e entra. Sem isso, os dois fluxos caíam em 404.
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // O client (@supabase/ssr) detecta a sessão na URL ao montar.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (senha.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }
    if (senha !== confirma) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      setError("Não foi possível salvar. O link pode ter expirado — peça um novo.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/"), 1200);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Brand />
        </div>
        <Card>
          <CardContent>
            {done ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Senha definida!</h2>
                <p className="text-sm text-muted-foreground">
                  Entrando no painel…
                </p>
              </div>
            ) : !ready ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !hasSession ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Link inválido ou expirado</h2>
                <p className="text-sm text-muted-foreground">
                  Abra o link mais recente do e-mail ou solicite um novo.
                </p>
                <a
                  href="/recuperar-senha"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Solicitar novo link
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Defina sua senha</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie uma senha para acessar o painel da sua rede.
                  </p>
                </div>
                <div>
                  <Label htmlFor="senha">Nova senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirma">Confirmar senha</Label>
                  <Input
                    id="confirma"
                    type="password"
                    autoComplete="new-password"
                    value={confirma}
                    onChange={(e) => setConfirma(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Salvando…" : "Salvar senha e entrar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
