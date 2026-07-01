"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/transcribe";
import { sendPush } from "@/lib/fcm";
import { getRedeMarcaById } from "@/lib/rede-branding";

export async function transcreverAudio(dataUrl: string): Promise<{ texto: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { texto: "" };
  return { texto: await transcribeAudio(dataUrl) };
}

export async function enviarSugestao(input: {
  texto: string;
  audioPath?: string | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) return { error: "Sessão expirada." };

  // Papel define o destino: admin da rede → plataforma; app user → rede.
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, papel, rede_id")
    .eq("id", sub)
    .maybeSingle();

  let rede_id: string;
  let destino: "rede" | "plataforma";
  let autor_nome: string;

  if (profile?.papel === "admin_supermercado" && profile.rede_id) {
    destino = "plataforma";
    rede_id = profile.rede_id;
    autor_nome = profile.nome;
  } else {
    const { data: ident } = await supabase
      .from("identidades")
      .select("nome")
      .eq("id", sub)
      .maybeSingle();
    const { data: membro } = await supabase
      .from("rede_membros")
      .select("rede_id")
      .eq("identidade_id", sub)
      .eq("status", "ativo")
      .limit(1)
      .maybeSingle();
    if (!ident || !membro)
      return { error: "Você precisa estar em uma rede para enviar sugestão." };
    destino = "rede";
    rede_id = membro.rede_id;
    autor_nome = ident.nome;
  }

  if (!input.texto.trim() && !input.audioPath)
    return { error: "Escreva ou grave a sugestão." };

  const { error } = await supabase.from("sugestoes").insert({
    autor_id: sub,
    autor_nome,
    rede_id,
    destino,
    texto: input.texto.trim(),
    audio_url: input.audioPath ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/sugestoes");
  return { ok: true };
}

export async function resolverSugestao(
  id: string,
  resolvida: boolean,
): Promise<{ ok: boolean; notificado: boolean }> {
  const supabase = await createClient();

  // Pega autor/rede antes de atualizar, para poder notificar o autor.
  const { data: sug } = await supabase
    .from("sugestoes")
    .select("autor_id, rede_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("sugestoes")
    .update({ status: resolvida ? "resolvida" : "nova" })
    .eq("id", id);
  if (error) return { ok: false, notificado: false };

  let notificado = false;
  // Só notifica ao MARCAR como resolvida (não ao reabrir).
  if (resolvida && sug?.autor_id) {
    try {
      const admin = createAdminClient();
      const { data: tokens } = await admin
        .from("device_tokens")
        .select("token")
        .eq("identidade_id", sug.autor_id);
      const lista = (tokens ?? []).map((t) => String(t.token));
      if (lista.length > 0) {
        const marca = sug.rede_id ? await getRedeMarcaById(sug.rede_id) : null;
        const { sent, invalid } = await sendPush(lista, {
          title: "Sugestão recebida",
          body: "Os responsáveis receberam sua sugestão e vão avaliar. Obrigado!",
          data: { tipo: "sugestao" },
          color: marca?.app_cor || marca?.cor_primaria || undefined,
        });
        notificado = sent > 0;
        if (invalid.length > 0) {
          await admin.from("device_tokens").delete().in("token", invalid);
        }
      }
    } catch {
      /* push é best-effort — não bloqueia a resolução */
    }
  }

  revalidatePath("/sugestoes");
  return { ok: true, notificado };
}
