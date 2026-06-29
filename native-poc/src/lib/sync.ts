import { supabase } from "./supabase";
import {
  getQueueItems,
  markQueueItemStatus,
  removeQueueItem,
} from "./queue-store";
import type { QueueRecord } from "./operator-types";

async function uploadPhoto(dataUrl: string, memberId: string) {
  if (dataUrl.startsWith("http")) return dataUrl;

  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mime });
  const path = `${memberId}/${crypto.randomUUID()}.jpg`;
  const upload = await supabase.storage.from("respostas-fotos").upload(path, blob, {
    contentType: mime,
    upsert: false,
  });

  if (upload.error) throw upload.error;

  return supabase.storage.from("respostas-fotos").getPublicUrl(path).data.publicUrl;
}

async function syncPocSubmission(record: Extract<QueueRecord, { kind: "poc_submission" }>) {
  const { error } = await supabase.from("native_poc_submissions").insert({
    local_id: record.id,
    title: record.payload.title,
    location: record.payload.location,
    notes: record.payload.notes,
    created_at_device: record.createdAt,
  });

  if (error) throw error;
}

async function syncFormResponse(record: Extract<QueueRecord, { kind: "form_response" }>) {
  const items = [];

  for (const item of record.payload.items) {
    const fotoUrl = item.fotoDataUrl
      ? await uploadPhoto(item.fotoDataUrl, record.payload.memberId)
      : null;

    items.push({
      item_id: item.itemId,
      valor: item.valor,
      observacao: item.observacao,
      foto_url: fotoUrl,
    });
  }

  const { error } = await supabase.rpc("enviar_resposta", {
    p_formulario: record.payload.formId,
    p_itens: items,
    p_assinatura: record.payload.signature,
    p_data: record.payload.submittedAt.slice(0, 10),
  });

  if (error) throw error;
}

async function syncRecord(record: QueueRecord) {
  if (record.kind === "poc_submission") {
    await syncPocSubmission(record);
    return;
  }

  await syncFormResponse(record);
}

export async function syncQueue() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { sent: 0, failed: 0, online: false };
  }

  const items = await getQueueItems();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    if (item.status === "synced") continue;

    try {
      await syncRecord(item);
      await removeQueueItem(item.id);
      sent += 1;
    } catch (error) {
      // Não interrompe a fila: marca o erro e segue para o próximo item
      // (será re-tentado no próximo gatilho de sincronização).
      await markQueueItemStatus(
        item.id,
        "error",
        error instanceof Error ? error.message : "Falha ao sincronizar.",
      );
      failed += 1;
    }
  }

  if (sent > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("checkai:queue-synced", { detail: { sent } }));
  }

  return { sent, failed, online: true };
}

export async function compressPhoto(file: File, maxSide = 1280, quality = 0.72) {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas indisponível para comprimir foto.");

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
