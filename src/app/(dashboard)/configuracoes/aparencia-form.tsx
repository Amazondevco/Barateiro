"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, ImageIcon, RotateCcw, Check, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { FormState } from "./actions";

const DEFAULT_COLOR = "#2563eb";
const PALETTE = [
  "#2563eb", "#1d4ed8", "#0ea5e9", "#06b6d4", "#14b8a6", "#16a34a",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444",
  "#dc2626", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1",
  "#64748b", "#0f172a",
];

export function AparenciaForm({
  action,
  redeId,
  nome,
  logoUrl,
  bannerUrl,
  cor,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  redeId: string;
  nome: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  cor: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [logo, setLogo] = useState(logoUrl ?? "");
  const [banner, setBanner] = useState(bannerUrl ?? "");
  const [color, setColor] = useState(cor ?? DEFAULT_COLOR);
  const [preview, setPreview] = useState<"light" | "dark">("light");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  async function upload(file: File, kind: "logo" | "banner") {
    setErr(null);
    setBusy(kind);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${redeId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      if (kind === "logo") setLogo(data.publicUrl);
      else setBanner(data.publicUrl);
    } catch {
      setErr("Falha no upload. Tente uma imagem menor (PNG/JPG).");
    } finally {
      setBusy(null);
    }
  }

  function resetAll() {
    setLogo(logoUrl ?? "");
    setBanner(bannerUrl ?? "");
    setColor(cor ?? DEFAULT_COLOR);
    setErr(null);
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-8 pb-4">
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="banner_url" value={banner} />
      <input type="hidden" name="cor_primaria" value={color} />

      {/* BANNER */}
      <section>
        <h3 className="text-lg font-semibold">Banner</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Imagem de cabeçalho da rede. Prefira PNG transparente, em formato
          panorâmico. Aparece no topo do ambiente.
        </p>
        <div
          onClick={() => bannerInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) upload(f, "banner");
          }}
          className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary"
        >
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt="Banner"
              className="mx-auto max-h-28 rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">
                {busy === "banner"
                  ? "Enviando…"
                  : "Arraste o banner ou clique para selecionar"}
              </span>
            </div>
          )}
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "banner");
            }}
          />
        </div>
        {banner && (
          <button
            type="button"
            onClick={() => setBanner("")}
            className="mt-2 text-xs text-danger hover:underline"
          >
            Remover banner
          </button>
        )}
      </section>

      {/* ÍCONE / LOGO */}
      <section>
        <h3 className="text-lg font-semibold">Ícone / Logo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pequeno ícone que representa a rede no menu e na aba do navegador.
        </p>
        <div className="mt-3 flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={nome}
              className="h-14 w-14 rounded-xl border border-border object-contain"
            />
          ) : (
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ background: color }}
            >
              {nome.charAt(0)}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => logoInput.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {busy === "logo" ? "Enviando…" : "Carregar imagem"}
          </Button>
          {logo && (
            <button
              type="button"
              onClick={() => setLogo("")}
              className="text-xs text-danger hover:underline"
            >
              Remover
            </button>
          )}
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "logo");
            }}
          />
        </div>
      </section>

      {/* TEMA */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tema</h3>
          <button
            type="button"
            onClick={() => setColor(DEFAULT_COLOR)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Redefinir para o padrão
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cor primária da marca, aplicada em todo o ambiente da rede.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PALETTE.map((c) => {
            const selected = color.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  "relative h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition",
                  selected && "ring-2 ring-foreground",
                )}
                style={{ background: c }}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            );
          })}
          {/* Cor personalizada */}
          <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-border text-lg text-muted-foreground hover:border-primary hover:text-primary">
            +
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
      </section>

      {/* PRÉVIA */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prévia</h3>
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setPreview("light")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                preview === "light" ? "bg-muted" : "text-muted-foreground",
              )}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreview("dark")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                preview === "dark" ? "bg-muted" : "text-muted-foreground",
              )}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={preview === "dark" ? "dark" : ""}>
          <div
            className="mt-3 space-y-3 rounded-xl border border-border bg-background p-4"
            style={{ ["--primary"]: color } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={nome}
                  className="h-9 w-9 rounded-lg object-contain"
                />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: color }}
                >
                  {nome.charAt(0)}
                </span>
              )}
              <span className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground">{nome}</span>
                <span className="text-[11px] text-muted-foreground">
                  Gestão da Rede
                </span>
              </span>
            </div>
            <div className="flex gap-2">
              <span
                className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white"
                style={{ background: color }}
              >
                Botão primário
              </span>
              <span
                className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium"
                style={{ borderColor: color, color }}
              >
                Outline
              </span>
            </div>
          </div>
        </div>
      </section>

      {err && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
          Salvo. Recarregue para ver o tema aplicado no ambiente.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={resetAll}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !!busy}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
