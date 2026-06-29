import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  Loader2,
  PenLine,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchFormDefinition } from "../lib/operator-api";
import type {
  FormDefinition,
  FormItem,
  FormResponseItemPayload,
  FormSection,
} from "../lib/operator-types";
import { enqueueFormResponse } from "../lib/queue-store";
import { compressPhoto, syncQueue } from "../lib/sync";
import { LoadingScreen } from "../ui/loading-screen";
import { SignaturePad } from "../ui/signature-pad";

const OPTIONS: Record<string, Array<[string, string]>> = {
  ok_nao: [
    ["ok", "OK"],
    ["nao", "NÃO"],
  ],
  sim_nao: [
    ["sim", "Sim"],
    ["nao", "Não"],
  ],
  abastecido_ruptura: [
    ["abastecido", "Abastecido"],
    ["ruptura", "Ruptura"],
  ],
};

export function FillFormPage() {
  const navigate = useNavigate();
  const { memberId = "", formId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchFormDefinition(memberId, formId);
        setForm(result.form);
        setSavedSignature(result.signature);
        setSignature(result.signature);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar formulário.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [formId, memberId]);

  const steps = useMemo(() => {
    if (!form) return [] as FormSection[][];
    const pages: FormSection[][] = [[]];

    for (const section of form.sections) {
      const current = pages[pages.length - 1];
      if (section.quebraPagina && current.length > 0) {
        pages.push([section]);
      } else {
        current.push(section);
      }
    }

    return pages.filter((page) => page.length > 0);
  }, [form]);

  if (loading) {
    return <LoadingScreen label="Carregando formulário do operador…" />;
  }

  if (!form) {
    return (
      <div className="page">
        <p className="banner danger inline-banner">{error ?? "Formulário indisponível."}</p>
      </div>
    );
  }

  function labelFor(item: FormItem, value: string) {
    const pair = OPTIONS[item.tipo]?.find(([candidate]) => candidate === value);
    return pair?.[1] ?? (value || "N/A");
  }

  function validate() {
    for (const section of form.sections) {
      for (const item of section.items) {
        const value = values[item.id] ?? "";
        const nonConforming = ["nao", "ruptura"].includes(value);

        if (!value && item.tipo !== "texto" && item.tipo !== "numero" && item.tipo !== "foto") {
          return `Preencha "${item.texto}".`;
        }

        if (item.obrigaObsQuandoNao && nonConforming && !(notes[item.id] ?? "").trim()) {
          return `Adicione observação em "${item.texto}".`;
        }

        if (item.obrigaFotoQuandoNao && nonConforming && !photos[item.id]) {
          return `Adicione foto em "${item.texto}".`;
        }
      }
    }

    if (!signature) return "Adicione a assinatura antes de enviar.";
    return null;
  }

  async function handleSubmit() {
    const pending = validate();
    if (pending) {
      setError(pending);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: FormResponseItemPayload[] = form.sections.flatMap((section) =>
        section.items.map((item) => ({
          itemId: item.id,
          valor: values[item.id] ?? "",
          observacao: (notes[item.id] ?? "").trim() || null,
          fotoDataUrl: photos[item.id] || undefined,
        })),
      );

      await enqueueFormResponse({
        memberId,
        formId,
        formName: form.nome,
        submittedAt: new Date().toISOString(),
        signature: signature!,
        items: payload,
      });

      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncQueue();
      }

      navigate("/app/formularios");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao enviar o formulário.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentStep = steps[stepIndex] ?? [];

  return (
    <div className="page compact-page">
      <header className="compact-header">
        <Link to={`/app/rede/${memberId}`} className="icon-button">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1>{reviewing ? "Revisão final" : form.nome}</h1>
          <p className="section-copy">{form.descricao ?? "Checklist do operador"}</p>
        </div>
      </header>

      {error ? <p className="banner danger inline-banner">{error}</p> : null}

      {!reviewing ? (
        <>
          <div className="progress-row">
            {steps.map((_, index) => (
              <div key={index} className={`progress-step ${index <= stepIndex ? "active" : ""}`} />
            ))}
          </div>

          <section className="card stack-md">
            {currentStep.map((section) => (
              <div key={section.id} className="stack-sm">
                {section.titulo ? <h2>{section.titulo}</h2> : null}
                {section.items.map((item) => (
                  <FormItemCard
                    key={item.id}
                    item={item}
                    permiteNa={section.permiteNa}
                    value={values[item.id] ?? ""}
                    note={notes[item.id] ?? ""}
                    photo={photos[item.id] ?? ""}
                    onValue={(next) => setValues((prev) => ({ ...prev, [item.id]: next }))}
                    onNote={(next) => setNotes((prev) => ({ ...prev, [item.id]: next }))}
                    onPhoto={(next) => setPhotos((prev) => ({ ...prev, [item.id]: next }))}
                  />
                ))}
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="stack-md">
          <div className="card stack-sm">
            <div className="queue-row">
              <div>
                <h2>Revisão</h2>
                <p className="section-copy">Confira respostas, observações e fotos antes do envio.</p>
              </div>
              <ClipboardCheck size={20} />
            </div>

            {form.sections.map((section) => (
              <div key={section.id} className="review-block">
                {section.titulo ? <h3>{section.titulo}</h3> : null}
                {section.items.map((item) => {
                  const photo = photos[item.id];
                  const note = notes[item.id];
                  return (
                    <div key={item.id} className="review-item">
                      <strong>{item.texto}</strong>
                      <p>{labelFor(item, values[item.id] ?? "")}</p>
                      {note ? <p className="muted">Obs.: {note}</p> : null}
                      {photo ? <img src={photo} alt="" className="review-photo" /> : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card stack-md">
            <div className="queue-row">
              <div>
                <h2>Assinatura</h2>
                <p className="section-copy">
                  {savedSignature ? "Você pode reaproveitar a assinatura salva ou desenhar outra." : "Assine para concluir o envio."}
                </p>
              </div>
              <PenLine size={20} />
            </div>

            {savedSignature && !signature ? (
              <button className="secondary-button" type="button" onClick={() => setSignature(savedSignature)}>
                Usar assinatura salva
              </button>
            ) : null}

            <SignaturePad value={signature} onChange={setSignature} />
          </div>
        </section>
      )}

      <div className="footer-actions">
        {reviewing ? (
          <>
            <button className="secondary-button" type="button" onClick={() => setReviewing(false)}>
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
              Enviar
            </button>
          </>
        ) : (
          <>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
            {stepIndex === steps.length - 1 ? (
              <button className="primary-button" type="button" onClick={() => setReviewing(true)}>
                <ClipboardCheck size={16} />
                Revisar
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                Próxima
                <ArrowRight size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FormItemCard({
  item,
  permiteNa,
  value,
  note,
  photo,
  onValue,
  onNote,
  onPhoto,
}: {
  item: FormItem;
  permiteNa: boolean;
  value: string;
  note: string;
  photo: string;
  onValue: (next: string) => void;
  onNote: (next: string) => void;
  onPhoto: (next: string) => void;
}) {
  const nonConforming = ["nao", "ruptura"].includes(value);

  return (
    <article className="form-item-card">
      <div className="stack-sm">
        <strong>{item.texto}</strong>
        {item.ajuda ? <p className="muted">{item.ajuda}</p> : null}
      </div>

      <ItemInput item={item} value={value} permiteNa={permiteNa} onValue={onValue} />

      {item.obrigaObsQuandoNao && nonConforming ? (
        <label className="field">
          <span>Observação</span>
          <textarea rows={3} value={note} onChange={(event) => onNote(event.target.value)} />
        </label>
      ) : null}

      {item.obrigaFotoQuandoNao && nonConforming ? (
        <PhotoField value={photo} onChange={onPhoto} />
      ) : null}
    </article>
  );
}

function ItemInput({
  item,
  value,
  permiteNa,
  onValue,
}: {
  item: FormItem;
  value: string;
  permiteNa: boolean;
  onValue: (next: string) => void;
}) {
  const options = OPTIONS[item.tipo];

  if (item.tipo === "multipla_escolha") {
    return (
      <div className="choice-column">
        {(item.opcoes ?? []).map((option) => (
          <label key={option} className="choice-line">
            <input
              type="radio"
              name={item.id}
              checked={value === option}
              onChange={() => onValue(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (options) {
    return (
      <div className="choice-grid">
        {options.map(([candidate, label]) => (
          <button
            key={candidate}
            className={`choice-pill ${value === candidate ? "active" : ""}`}
            type="button"
            onClick={() => onValue(candidate)}
          >
            {label}
          </button>
        ))}
        {permiteNa ? (
          <button
            className={`choice-pill ${value === "na" ? "active" : ""}`}
            type="button"
            onClick={() => onValue("na")}
          >
            N/A
          </button>
        ) : null}
      </div>
    );
  }

  if (item.tipo === "texto") {
    return (
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        placeholder="Resposta"
      />
    );
  }

  if (item.tipo === "numero") {
    return (
      <input
        type="number"
        value={value}
        onChange={(event) => onValue(event.target.value)}
        placeholder="Resposta"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onValue(event.target.value)}
      placeholder="Resposta"
    />
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      onChange(await compressPhoto(file));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="photo-field">
      <label className="secondary-button upload-label">
        {uploading ? <Loader2 className="spin" size={16} /> : <Camera size={16} />}
        {value ? "Trocar foto" : "Adicionar foto"}
        <input type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
      </label>
      {value ? (
        <div className="photo-preview">
          <img src={value} alt="" className="review-photo" />
          <button className="ghost-button" type="button" onClick={() => onChange("")}>
            <Trash2 size={16} />
            Remover
          </button>
        </div>
      ) : null}
    </div>
  );
}
