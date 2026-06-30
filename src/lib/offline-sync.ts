import { createClient } from "@/lib/supabase/client";
import {
  listOutbox,
  deleteOutbox,
  updateOutbox,
  type OutboxSubmission,
} from "@/lib/offline-db";

// Sincroniza a fila de envios: sobe as fotos e chama enviar_resposta.
// Roda ao abrir o app, ao voltar a conexão e após cada envio.

const EVT = "checkai-outbox-changed";

export function onOutboxChange(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

function dataUrlToBlob(d: string): Blob {
  const [head, b64] = d.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function pendingCount(): Promise<number> {
  try {
    return (await listOutbox()).length;
  } catch {
    return 0;
  }
}

let rodando = false;

export async function sincronizar(): Promise<void> {
  if (rodando) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  rodando = true;
  try {
    const subs = await listOutbox();
    if (!subs.length) return;
    const supabase = createClient();

    for (const sub of subs) {
      try {
        const itens = [];
        for (const it of sub.itens) {
          let foto_url = "";
          if (it.fotoDataUrl) {
            // já é URL pública (re-tentativa) → não sobe de novo
            if (it.fotoDataUrl.startsWith("http")) {
              foto_url = it.fotoDataUrl;
            } else {
              const blob = dataUrlToBlob(it.fotoDataUrl);
              const path = `${crypto.randomUUID()}.jpg`;
              const up = await supabase.storage
                .from("respostas-fotos")
                .upload(path, blob, { contentType: blob.type });
              if (up.error) throw up.error;
              foto_url = supabase.storage
                .from("respostas-fotos")
                .getPublicUrl(path).data.publicUrl;
            }
          }
          itens.push({
            item_id: it.item_id,
            valor: it.valor,
            observacao: it.observacao,
            foto_url,
          });
        }

        const { error } = await supabase.rpc("enviar_resposta", {
          p_formulario: sub.formId,
          p_itens: itens,
          p_assinatura: sub.assinatura,
          // preserva a data em que o formulário foi preenchido (offline)
          p_data: (sub.criadoEm || "").slice(0, 10) || undefined,
          p_lat: sub.lat ?? undefined,
          p_lng: sub.lng ?? undefined,
        });
        if (error) throw error;

        await deleteOutbox(sub.id as number);
        emit();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateOutbox(sub.id as number, {
          tentativas: (sub.tentativas || 0) + 1,
          erro: msg,
        });
        emit();
        // sem conexão → para; tenta de novo quando voltar
        if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      }
    }
  } catch {
    /* ignore */
  } finally {
    rodando = false;
    emit();
  }
}

// Reduz a foto antes de guardar offline (menos espaço e upload mais rápido).
export async function comprimirFoto(
  file: File,
  max = 1280,
  q = 0.7,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", q);
  } finally {
    URL.revokeObjectURL(url);
  }
}
