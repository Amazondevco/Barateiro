"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, Shield } from "lucide-react";
import { perguntarAssistente, type Msg } from "@/lib/assistente-actions";

export function AssistantFab({ papel }: { papel: "super_admin" | "admin_supermercado" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        papel === "super_admin"
          ? "Olá. Sou o assistente do Check.AI. Posso consultar números e métricas das redes (sem acessar conteúdo de checklists nem dados sensíveis)."
          : "Olá. Sou o assistente da sua rede. Posso consultar os dados da SUA rede — equipe, formulários, respostas e pendências. Não vejo outras redes nem dados do sistema.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || carregando) return;
    const novas: Msg[] = [...msgs, { role: "user", content: texto }];
    setMsgs(novas);
    setInput("");
    setCarregando(true);
    const { resposta } = await perguntarAssistente(novas.slice(-8));
    setMsgs((m) => [...m, { role: "assistant", content: resposta }]);
    setCarregando(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#6d28d9] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Assistente IA"
        title="Assistente IA"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[min(560px,80vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-[#6d28d9] p-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Assistente Check.AI</p>
                <p className="flex items-center gap-1 text-[11px] opacity-80">
                  <Shield className="h-3 w-3" /> Consulta segura
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="opacity-80 hover:opacity-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> consultando…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-2">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                rows={1}
                placeholder="Pergunte sobre os dados…"
                className="max-h-28 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                onClick={enviar}
                disabled={carregando || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6d28d9] text-white disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
