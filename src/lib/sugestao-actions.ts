"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/transcribe";

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

export async function resolverSugestao(id: string, resolvida: boolean) {
  const supabase = await createClient();
  await supabase
    .from("sugestoes")
    .update({ status: resolvida ? "resolvida" : "nova" })
    .eq("id", id);
  revalidatePath("/sugestoes");
}
