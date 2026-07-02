import { createClient as createSupabase } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Emite um magic link (Supabase Auth, expira sozinho) para o admin logado no
// APP NATIVO abrir o console web (/app/admin) já autenticado — sem digitar a
// senha de novo. Chamado com o access_token da própria sessão do admin no app.
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
    return Response.json({ error: "Sem sessão." }, { status: 401, headers: cors });
  }

  // Identifica quem está chamando (token da própria sessão do app nativo).
  const asUser = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const {
    data: { user },
  } = await asUser.auth.getUser();
  if (!user) {
    return Response.json({ error: "Sessão inválida." }, { status: 401, headers: cors });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.email || profile.papel !== "admin_supermercado") {
    return Response.json(
      { error: "Apenas o admin da rede pode abrir o console." },
      { status: 403, headers: cors },
    );
  }

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
    options: { redirectTo: "https://check-ai-br.vercel.app/app/admin" },
  });
  if (error || !link?.properties?.action_link) {
    return Response.json(
      { error: error?.message ?? "Não foi possível gerar o link." },
      { status: 500, headers: cors },
    );
  }

  return Response.json({ url: link.properties.action_link }, { headers: cors });
}
