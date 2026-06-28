import { createClient } from "@/lib/supabase/server";
import type { Profile, Papel } from "@/lib/types";

/** Usuário autenticado + profile. Retorna null se não logado. */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) return profile as Profile;

  // Fallback (schema ainda não aplicado ou profile ausente): deriva do metadata.
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    rede_id: (meta.rede_id as string) ?? null,
    nome: (meta.nome as string) ?? "",
    email: user.email ?? "",
    papel: ((meta.papel as Papel) ?? "super_admin") as Papel,
    avatar_url: null,
    status: "ativo",
  };
}
