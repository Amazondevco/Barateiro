import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Papel } from "@/lib/types";

export type RedeBrand = {
  id: string;
  nome: string;
  logo_url: string | null;
  banner_url: string | null;
  cor_primaria: string | null;
  cor_sidebar: string | null;
};

/**
 * Profile + marca da rede, em UMA query (embed) e deduplicado por request
 * via React cache(). Layout e páginas compartilham o mesmo resultado —
 * evita repetir getUser()/profiles()/redes() a cada navegação.
 */
export const getSessionContext = cache(
  async (): Promise<{ profile: Profile | null; rede: RedeBrand | null }> => {
    const supabase = await createClient();
    // getClaims() verifica o token localmente (sem ida à rede quando a chave
    // é assimétrica). A sessão já foi validada/renovada no proxy.
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims as
      | { sub: string; email?: string; user_metadata?: Record<string, unknown> }
      | undefined;
    if (!claims?.sub) return { profile: null, rede: null };

    const { data } = await supabase
      .from("profiles")
      .select("*, redes(id,nome,logo_url,banner_url,cor_primaria,cor_sidebar)")
      .eq("id", claims.sub)
      .single();

    let profile: Profile;
    let rede: RedeBrand | null = null;

    if (data) {
      const { redes, ...p } = data as Profile & { redes: RedeBrand | null };
      profile = p as Profile;
      rede = (redes as RedeBrand) ?? null;
    } else {
      // Fallback: schema/profile ausente → deriva do metadata do token.
      const meta = claims.user_metadata ?? {};
      profile = {
        id: claims.sub,
        rede_id: (meta.rede_id as string) ?? null,
        nome: (meta.nome as string) ?? "",
        email: claims.email ?? "",
        papel: ((meta.papel as Papel) ?? "super_admin") as Papel,
        avatar_url: null,
        status: "ativo",
      };
    }

    // Super admin (sem rede) usa a marca da PLATAFORMA
    if (!profile.rede_id) {
      const { data: plat } = await supabase
        .from("plataforma")
        .select("nome,logo_url,banner_url,cor_primaria,cor_sidebar")
        .eq("id", true)
        .single();
      if (plat) {
        rede = {
          id: "plataforma",
          nome: plat.nome,
          logo_url: plat.logo_url,
          banner_url: plat.banner_url,
          cor_primaria: plat.cor_primaria,
          cor_sidebar: plat.cor_sidebar,
        };
      }
    }

    return { profile, rede };
  },
);

/** Apenas o profile (reusa o contexto cacheado). */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  return (await getSessionContext()).profile;
});
