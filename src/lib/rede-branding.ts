import { createClient, createAdminClient } from "@/lib/supabase/server";

// Marca/identidade da rede para o APP. Os membros do app estão em
// identidades+rede_membros (não têm `profiles`), então a RLS de `redes`
// (id = auth_rede_id(), que sai de profiles) não os enxerga. Lemos a marca
// no servidor com service role, sempre ESCOPADA à própria rede do membro.

export type RedeMarca = {
  id: string;
  nome: string | null;
  app_icone_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  app_cor: string | null;
  cor_primaria: string | null;
};

const COLS =
  "id, nome, app_icone_url, logo_url, banner_url, app_cor, cor_primaria";

export async function getRedeMarcaById(
  redeId: string,
): Promise<RedeMarca | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("redes")
    .select(COLS)
    .eq("id", redeId)
    .maybeSingle();
  return (data as RedeMarca) ?? null;
}

// Marca da rede do usuário logado (descobre a rede pela sessão; lê com admin).
export async function getMinhaRedeMarca(): Promise<RedeMarca | null> {
  const redeId = await getMinhaRedeId();
  return redeId ? getRedeMarcaById(redeId) : null;
}

export async function getMinhaRedeId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) return null;
  const { data: membro } = await supabase
    .from("rede_membros")
    .select("rede_id")
    .eq("identidade_id", sub)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();
  return (membro as { rede_id?: string } | null)?.rede_id ?? null;
}

// Vínculo do membro logado (unidade/depto/cargo/papel) — também via admin,
// pois essas tabelas têm a mesma limitação de RLS para membros do app.
export type MeuVinculo = {
  papel: string | null;
  rede: string | null;
  unidade: string | null;
  departamento: string | null;
  cargo: string | null;
};

export async function getMeuVinculo(): Promise<MeuVinculo | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("rede_membros")
    .select(
      "papel, redes(nome), unidades(nome), departamentos(nome), cargos(nome)",
    )
    .eq("identidade_id", sub)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const m = data as unknown as {
    papel: string | null;
    redes: { nome: string } | null;
    unidades: { nome: string } | null;
    departamentos: { nome: string } | null;
    cargos: { nome: string } | null;
  };
  return {
    papel: m.papel,
    rede: m.redes?.nome ?? null,
    unidade: m.unidades?.nome ?? null,
    departamento: m.departamentos?.nome ?? null,
    cargo: m.cargos?.nome ?? null,
  };
}
