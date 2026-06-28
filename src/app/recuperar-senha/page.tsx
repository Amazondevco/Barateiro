"use client";

import { useState } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/redefinir`,
    });
    setLoading(false);
    if (error) setError("Não foi possível enviar. Tente novamente.");
    else setSent(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Brand />
        </div>
        <Card>
          <CardContent>
            {sent ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Verifique seu e-mail</h2>
                <p className="text-sm text-muted-foreground">
                  Se houver uma conta com esse e-mail, enviamos um link para
                  redefinir a senha.
                </p>
                <a
                  href="/login"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Voltar ao login
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Recuperar senha</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enviaremos um link de redefinição.
                  </p>
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Enviando…" : "Enviar link"}
                </Button>
                <a
                  href="/login"
                  className="block text-center text-sm text-muted-foreground hover:text-primary"
                >
                  Voltar ao login
                </a>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
