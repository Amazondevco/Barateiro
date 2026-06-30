"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

// Tela de cadastro do responsável (alvo do link de convite) e de redefinição de
// senha. O link do e-mail traz a sessão; aqui mostramos os dados já cadastrados
// (rede + e-mail + nome) e a pessoa só define a senha para concluir.
type Ctx = { email: string; nome: string; redeNome: string | null };

// Client SEM detectSessionInUrl: nós mesmos lemos o token do # e fazemos
// setSession (evita a corrida que limpava o hash antes da sessão se estabelecer).
function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { detectSessionInUrl: false } },
  );
}

export default function RedefinirSenhaPage() {
  const router = useRouter();
  // Captura o # na primeira render, antes de qualquer client poder limpá-lo.
  const hashRef = useRef<string | null>(null);
  if (hashRef.current === null && typeof window !== "undefined") {
    hashRef.current = window.location.hash;
  }
  const [ready, setReady] = useState(false);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = makeClient();

    async function carregar() {
      // O link traz o token no # (capturado em hashRef). Estabelecemos a sessão
      // explicitamente — sem depender do detectSessionInUrl / fluxo PKCE.
      const hash = (hashRef.current ?? "").replace(/^#/, "");
      if (hash) {
        const p = new URLSearchParams(hash);
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");
        const errDesc = p.get("error_description");
        if (errDesc) {
          setReady(true);
          return;
        }
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          // limpa o token da URL
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        // sem token e sem sessão → não é um link válido; vai pro login
        router.replace("/login");
        return;
      }
      const meta = (user.user_metadata ?? {}) as {
        nome?: string;
        rede_id?: string;
      };
      let redeNome: string | null = null;
      if (meta.rede_id) {
        const { data: rede } = await supabase
          .from("redes")
          .select("nome")
          .eq("id", meta.rede_id)
          .maybeSingle();
        redeNome = (rede?.nome as string) ?? null;
      }
      setCtx({
        email: user.email ?? "",
        nome: meta.nome ?? "",
        redeNome,
      });
      setReady(true);
    }

    void carregar();
  }, [router]);

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
    const supabase = makeClient();
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
                <h2 className="text-lg font-semibold">Cadastro concluído!</h2>
                <p className="text-sm text-muted-foreground">
                  Entrando no painel…
                </p>
              </div>
            ) : !ready ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !ctx ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Link inválido ou expirado</h2>
                <p className="text-sm text-muted-foreground">
                  Abra o link mais recente do e-mail ou peça um novo convite.
                </p>
                <a
                  href="/login"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ir para o login
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Concluir cadastro</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ctx.redeNome
                      ? `Você foi convidado para administrar ${ctx.redeNome}. Confira seus dados e defina uma senha.`
                      : "Confira seus dados e defina uma senha."}
                  </p>
                </div>

                {ctx.redeNome && (
                  <div>
                    <Label>Rede</Label>
                    <Input value={ctx.redeNome} readOnly disabled />
                  </div>
                )}
                <div>
                  <Label>Nome</Label>
                  <Input value={ctx.nome} readOnly disabled />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={ctx.email} readOnly disabled />
                </div>

                <div>
                  <Label htmlFor="senha">Crie uma senha</Label>
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
                  {loading ? "Salvando…" : "Criar senha e entrar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
