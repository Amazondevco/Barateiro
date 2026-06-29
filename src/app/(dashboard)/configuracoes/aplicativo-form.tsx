"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, Loader2, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateAplicativoRede, type AppRedeState } from "./aplicativo-actions";

export function AplicativoForm({
  redeId,
  iconeUrl,
  bannerUrl,
}: {
  redeId: string;
  iconeUrl: string | null;
  bannerUrl: string | null;
}) {
  const [icone, setIcone] = useState(iconeUrl ?? "");
  const [banner, setBanner] = useState(bannerUrl ?? "");
  const [state, formAction, pending] = useActionState(
    updateAplicativoRede.bind(null, redeId),
    {} as AppRedeState,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <p className="text-sm text-muted-foreground">
        Defina como o app da sua rede aparece no celular: o ícone na tela inicial
        e o banner dentro do app.
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

      <ImageField
        label="Banner do app"
        hint="Imagem de fundo no topo da tela inicial do app."
        value={banner}
        onChange={setBanner}
        previewSize={120}
        wide
        name="banner_url"
      />

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
