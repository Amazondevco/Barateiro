import { useState } from "react";
import { Lightbulb, X, Loader2, Send, Check } from "lucide-react";
import { enviarSugestao } from "../lib/operator-api";

// Botão flutuante (canto inferior direito) para o operador mandar uma sugestão
// ao admin da rede. Fica acima da barra de navegação (raised).
export function SuggestionFab() {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function fechar() {
    setOpen(false);
    setTexto("");
    setErro(null);
    setOk(false);
  }

  async function enviar() {
    if (!texto.trim()) {
      setErro("Escreva a sugestão.");
      return;
    }
    setErro(null);
    setEnviando(true);
    const r = await enviarSugestao(texto);
    setEnviando(false);
    if (r.error) {
      setErro(r.error);
      return;
    }
    setOk(true);
    setTimeout(fechar, 1400);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar sugestão"
        className="fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        <Lightbulb className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={fechar}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Lightbulb className="h-4 w-4 text-primary" /> Sugestão de melhoria
              </h3>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {ok ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-medium">Sugestão enviada. Obrigado!</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Conte o que pode melhorar…"
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {erro && (
                  <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void enviar()}
                  disabled={enviando}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Enviar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
