import { useRef, useState } from "react";
import {
  Lightbulb,
  X,
  Loader2,
  Send,
  Check,
  Mic,
  Square,
  Trash2,
} from "lucide-react";
import {
  enviarSugestao,
  transcreverAudio,
  subirAudioSugestao,
} from "../lib/operator-api";

const MAX_SEG = 120;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result ?? ""));
    r.readAsDataURL(blob);
  });
}

// Botão flutuante (canto inferior direito) para o operador mandar uma sugestão
// ao admin da rede. Fica acima da barra de navegação (raised).
export function SuggestionFab() {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fechar() {
    setOpen(false);
    setTexto("");
    setErro(null);
    setOk(false);
    setAudioUrl(null);
    blobRef.current = null;
  }

  async function startRec() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        // transcreve (best-effort) e acrescenta ao texto
        setTranscrevendo(true);
        const dataUrl = await blobToDataUrl(blob);
        const t = await transcreverAudio(dataUrl);
        if (t) setTexto((prev) => (prev ? prev + "\n" : "") + t);
        setTranscrevendo(false);
      };
      recRef.current = rec;
      rec.start();
      setGravando(true);
      timerRef.current = setTimeout(stopRec, MAX_SEG * 1000);
    } catch (e) {
      // Usuário negou o microfone (ou já estava negado nas permissões do app).
      const nome = e instanceof DOMException ? e.name : "";
      if (nome === "NotAllowedError" || nome === "SecurityError") {
        setErro(
          "Permissão de microfone negada. Libere o microfone nas configurações do app para gravar.",
        );
      } else if (nome === "NotFoundError") {
        setErro("Nenhum microfone encontrado no aparelho.");
      } else {
        setErro("Não foi possível acessar o microfone.");
      }
    }
  }

  function stopRec() {
    if (timerRef.current) clearTimeout(timerRef.current);
    recRef.current?.stop();
    setGravando(false);
  }

  function removerAudio() {
    setAudioUrl(null);
    blobRef.current = null;
  }

  async function enviar() {
    if (!texto.trim() && !blobRef.current) {
      setErro("Escreva ou grave a sugestão.");
      return;
    }
    setErro(null);
    setEnviando(true);
    let audioPath: string | null = null;
    if (blobRef.current) audioPath = await subirAudioSugestao(blobRef.current);
    const r = await enviarSugestao(texto, audioPath);
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
        style={{ bottom: "calc(124px + env(safe-area-inset-bottom))" }}
      >
        <Lightbulb className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={fechar} />
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

                {/* Gravação de áudio → transcreve pra dentro do texto */}
                <div className="flex flex-wrap items-center gap-2">
                  {!gravando ? (
                    <button
                      type="button"
                      onClick={() => void startRec()}
                      disabled={transcrevendo}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                    >
                      <Mic className="h-4 w-4" /> Gravar áudio
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRec}
                      className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-2 text-sm text-white"
                    >
                      <Square className="h-4 w-4" /> Parar
                    </button>
                  )}
                  {transcrevendo && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcrevendo…
                    </span>
                  )}
                  {audioUrl && !gravando && (
                    <>
                      <audio src={audioUrl} controls className="h-8 max-w-[160px]" />
                      <button
                        type="button"
                        onClick={removerAudio}
                        aria-label="Remover áudio"
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {erro && (
                  <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void enviar()}
                  disabled={enviando || transcrevendo}
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
