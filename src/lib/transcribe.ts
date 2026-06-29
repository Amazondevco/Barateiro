// Transcrição de áudio via Groq Whisper. Server-only (usa GROQ_API_KEY).
export async function transcribeAudio(dataUrl: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return "";
  const m = dataUrl.match(/^data:(audio\/[^;]+);base64,(.+)$/);
  if (!m) return "";

  const buf = Buffer.from(m[2], "base64");
  const form = new FormData();
  form.append("file", new Blob([buf], { type: m[1] }), "audio.webm");
  form.append("model", process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo");
  form.append("language", "pt");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) return "";
    const json = await res.json();
    return (json?.text ?? "").trim();
  } catch {
    return "";
  }
}
