import { useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { enqueuePocSubmission } from "../lib/queue-store";
import { syncQueue } from "../lib/sync";

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
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar o formulário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page compact-page">
      <header className="compact-header">
        <Link to="/app/formularios" className="icon-button">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1>Teste offline</h1>
          <p className="section-copy">Fluxo mínimo para validação da fila local e sincronização.</p>
        </div>
      </header>

      {error ? <p className="banner danger inline-banner">{error}</p> : null}

      <form className="card stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Título</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>Local</span>
          <input
            type="text"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Ex.: Loja Centro"
            required
          />
        </label>
        <label className="field">
          <span>Observações</span>
          <textarea
            rows={5}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Registre um caso para a fila offline."
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
          Salvar e sincronizar
        </button>
      </form>
    </div>
  );
}
