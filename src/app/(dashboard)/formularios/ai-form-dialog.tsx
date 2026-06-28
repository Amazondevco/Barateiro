"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, Mic, MicOff, X, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateFormulario,
  importFormulario,
  type AiForm,
} from "./ai-actions";

export function AiFormDialog({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (data: AiForm) => void;
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [pending, startTransition] = useTransition();
  const recRef = useRef<{ stop: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setImporting(true);
    const fd = new FormData();
    fd.append("file", f);
    const res = await importFormulario(fd);
    setImporting(false);
    e.target.value = "";
    if (res.error || !res.data) {
      setError(res.error ?? "Falha ao importar.");
      return;
    }
    onGenerated(res.data);
    onClose();
  }

  function toggleMic() {
    setError(null);
    const SR =
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition ??
      (window as unknown as { SpeechRecognition?: new () => unknown })
        .SpeechRecognition;
    if (!SR) {
      setError("Seu navegador não suporta gravação de voz (use o Chrome).");
      return;
    }
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const rec = new (SR as new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: {
        resultIndex: number;
        results: { [k: number]: { [k: number]: { transcript: string } } } & {
          length: number;
        };
      }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
      stop: () => void;
    })();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setText((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  function gerar() {
    setError(null);
    startTransition(async () => {
      const res = await generateFormulario(text);
      if (res.error || !res.data) {
        setError(res.error ?? "Falha ao gerar.");
        return;
      }
      onGenerated(res.data);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="font-semibold">Criar formulário com IA</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Importe um formulário impresso ou descreva — o agente monta as
            seções e itens, otimizados para o preenchimento no celular.
          </p>

          {/* Importar arquivo */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
              hidden
              onChange={onFile}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={importing || pending}
            >
              <FileUp className="h-4 w-4" />
              {importing
                ? "Lendo arquivo…"
                : "Importar PDF, Word ou Excel"}
            </Button>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              A IA transforma seu formulário impresso em digital.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou descreva
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex.: Checklist diário de loja com hortifrúti, açougue, padaria e limpeza. Verificar validade, temperatura e abastecimento das gôndolas."
              className="min-h-36 pr-12"
            />
            <button
              type="button"
              onClick={toggleMic}
              title={recording ? "Parar gravação" : "Gravar voz"}
              className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                recording
                  ? "bg-danger text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {recording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>
          {recording && (
            <p className="text-xs text-danger">● Gravando… fale agora.</p>
          )}
          {error && (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={gerar} disabled={pending || !text.trim()}>
            <Sparkles className="h-4 w-4" />
            {pending ? "Gerando…" : "Gerar formulário"}
          </Button>
        </div>
      </div>
    </div>
  );
}
