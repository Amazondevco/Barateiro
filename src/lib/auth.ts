import { createClient } from "@/lib/supabase/server";
import type { Profile, Papel } from "@/lib/types";

export type RedeBrand = {
  id: string;
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
};

/** Profile + marca da rede (para white-label do tenant). */
export async function getSessionContext(): Promise<{
  profile: Profile | null;
  rede: RedeBrand | null;
}> {
  const profile = await getSessionProfile();
  if (!profile) return { profile: null, rede: null };
  if (!profile.rede_id) return { profile, rede: null };

  const supabase = await createClient();
  const { data } = await supabase
    .from("redes")
    .select("id,nome,logo_url,cor_primaria")
    .eq("id", profile.rede_id)
    .single();

  return { profile, rede: (data as RedeBrand) ?? null };
}

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
