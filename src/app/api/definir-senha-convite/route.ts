import { createClient } from "@supabase/supabase-js";
import { validarSenha } from "@/lib/senha";

export const dynamic = "force-dynamic";

// Conclui o cadastro a partir do convite PRÓPRIO (profiles.convite_token), para o
// APP NATIVO. Espelha o server action definirSenhaPorConvite: acha o profile pelo
// token, define a senha via admin API e marca o convite como usado. O token é o
// segredo (64 hex) — não exige sessão. Não expira por tempo; só deixa de valer
// quando concluído ou quando o admin gera outro link.
const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  let token = "";
  let senha = "";
  try {
    const body = (await req.json()) as { token?: unknown; senha?: unknown };
    token = String(body?.token ?? "").trim();
    senha = String(body?.senha ?? "");
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400, headers: cors });
  }

  if (!token) {
    return Response.json(
      { error: "Link inválido — peça um novo ao administrador." },
      { status: 400, headers: cors },
    );
  }
  const erro = validarSenha(senha);
  if (erro) return Response.json({ error: erro }, { status: 400, headers: cors });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: prof } = await admin
    .from("profiles")
    .select("id, email, convite_usado_em")
    .eq("convite_token", token)
    .maybeSingle();

  if (!prof) {
    return Response.json(
      { error: "Este link não é mais válido. Peça um novo ao administrador." },
      { status: 404, headers: cors },
    );
  }
  if (prof.convite_usado_em) {
    return Response.json(
      { error: "Este link já foi usado. Faça login ou peça um novo." },
      { status: 409, headers: cors },
    );
  }

  const { error: upErr } = await admin.auth.admin.updateUserById(prof.id, {
    password: senha,
    email_confirm: true,
  });
  if (upErr) {
    return Response.json(
      { error: "Não foi possível salvar a senha. Tente novamente." },
      { status: 500, headers: cors },
    );
  }

  await admin
    .from("profiles")
    .update({ convite_usado_em: new Date().toISOString() })
    .eq("id", prof.id);

  return Response.json({ ok: true, email: prof.email ?? null }, { headers: cors });
}
