import { createClient } from "@supabase/supabase-js";
import { transcribeAudio } from "@/lib/transcribe";

export const dynamic = "force-dynamic";

// Endpoint de transcrição para o app NATIVO (que não tem server actions).
// Recebe { dataUrl } (áudio base64), valida o token do usuário e devolve o texto.
// A PWA continua usando a server action `transcreverAudio` diretamente.

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "sem token" }, { status: 401, headers: cors });
  }

  // Valida o token: só usuários autenticados podem transcrever (evita abuso da chave).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "não autorizado" }, { status: 401, headers: cors });
  }

  let dataUrl = "";
  try {
    const body = (await req.json()) as { dataUrl?: unknown };
    dataUrl = String(body?.dataUrl ?? "");
  } catch {
    return Response.json({ error: "corpo inválido" }, { status: 400, headers: cors });
  }

  const texto = await transcribeAudio(dataUrl);
  return Response.json({ texto }, { headers: cors });
}
