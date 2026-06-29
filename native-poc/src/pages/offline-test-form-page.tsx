import { useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { enqueuePocSubmission } from "../lib/queue-store";
import { syncQueue } from "../lib/sync";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";

const initialState = {
  title: "Checklist de gôndola",
  location: "",
  notes: "",
};

export function OfflineTestFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await enqueuePocSubmission(form);
      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncQueue();
      }
      navigate("/app/formularios");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao salvar o formulário.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md p-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app/formularios")}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold leading-tight">Teste offline</h1>
          <p className="text-xs text-muted-foreground">
            Fluxo mínimo para validar a fila local e a sincronização.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
        onSubmit={handleSubmit}
      >
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Local</Label>
          <Input
            id="location"
            type="text"
            value={form.location}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, location: event.target.value }))
            }
            placeholder="Ex.: Loja Centro"
            required
          />
        </div>
        <div>
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            rows={5}
            value={form.notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Registre um caso para a fila offline."
            required
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Salvar e sincronizar
        </Button>
      </form>
    </div>
  );
}
