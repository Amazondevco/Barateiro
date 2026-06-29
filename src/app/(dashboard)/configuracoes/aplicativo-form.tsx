"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, Loader2, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateAplicativoRede, type AppRedeState } from "./aplicativo-actions";

const CORES = ["#2563eb", "#F97316", "#16a34a", "#7c3aed", "#dc2626", "#0d9488", "#db2777", "#0f172a"];

export function AplicativoForm({
  redeId,
  iconeUrl,
  cor,
}: {
  redeId: string;
  iconeUrl: string | null;
  cor: string | null;
}) {
  const [icone, setIcone] = useState(iconeUrl ?? "");
  const [appCor, setAppCor] = useState(cor ?? "#2563eb");
  const [state, formAction, pending] = useActionState(
    updateAplicativoRede.bind(null, redeId),
    {} as AppRedeState,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <p className="text-sm text-muted-foreground">
        Defina como o app da sua rede aparece no celular: o ícone na tela inicial
        e a cor do app (fundo da tela inicial, barra e botões).
      </p>

      <ImageField
        label="Ícone do app"
        hint="A carinha na tela inicial. Quadrada, 512×512px (PNG)."
        value={icone}
        onChange={setIcone}
        rounded
        previewSize={72}
        name="app_icone_url"
      />

      {/* Cor do app: fundo da Início + barra/botões */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Cor do app</label>
        <input type="hidden" name="app_cor" value={appCor} />
        <p className="mb-2 text-xs text-muted-foreground">
          Fundo da tela inicial (atrás da logo e do nome), barra e botões.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAppCor(c)}
              className="h-8 w-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                boxShadow: appCor.toLowerCase() === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
              }}
              aria-label={`Cor ${c}`}
            />
          ))}
          <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input px-2 text-xs text-muted-foreground">
            <input
              type="color"
              value={appCor}
              onChange={(e) => setAppCor(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            Outra
          </label>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Check className="h-4 w-4" /> Salvo. Reinstale o app no celular para ver o novo ícone.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}

function ImageField({
  label,
  hint,
  value,
  onChange,
  name,
  rounded,
  wide,
  previewSize,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  name: string;
  rounded?: boolean;
  wide?: boolean;
  previewSize: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubindo(true);
    const supabase = createClient();
    const ext = f.name.split(".").pop() || "png";
    const path = `app/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("branding").upload(path, f, { upsert: true });
    if (!up.error) onChange(supabase.storage.from("branding").getPublicUrl(path).data.publicUrl);
    setSubindo(false);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={value} />
      <input ref={ref} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted/30 ${rounded ? "rounded-2xl" : "rounded-lg"}`}
          style={{ width: wide ? previewSize * 2 : previewSize, height: previewSize }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <Smartphone className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={subindo}>
            {subindo ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Upload className="h-4 w-4" /> {value ? "Trocar" : "Escolher"}</>}
          </Button>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}
