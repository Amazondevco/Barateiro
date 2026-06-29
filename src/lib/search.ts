import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

// Busca global do dashboard — varre tudo no sistema, agrupado por seção.
// Escopo por sessão: admin vê só a própria rede; super_admin vê os clientes.
export type Hit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};
export type Group = { key: string; label: string; hits: Hit[] };
export type BuscaResultado = { groups: Group[]; total: number };

const VAZIO: BuscaResultado = { groups: [], total: 0 };

export async function buscaGlobal(
  qRaw: string,
  perGroup = 5,
): Promise<BuscaResultado> {
  const q = (qRaw ?? "").trim();
  if (q.length < 2) return VAZIO;
  // Sanitiza p/ os filtros do PostgREST (ilike / or).
  const safe = q.replace(/[%,()*\\]/g, " ").trim();
  if (!safe) return VAZIO;
  const like = `%${safe}%`; // .ilike()
  const star = `*${safe}*`; // .or() usa curinga *

  const profile = await getSessionProfile();
  if (!profile) return VAZIO;
  const isSuper = profile.papel === "super_admin";
  const redeId = profile.rede_id;
  const supabase = await createClient();

  const group = (key: string, label: string, hits: Hit[]): Group | null =>
    hits.length ? { key, label, hits } : null;

  const tasks: Promise<Group | null>[] = [];

  // Clientes (redes) — só super_admin
  if (isSuper) {
    tasks.push(
      (async (): Promise<Group | null> => {
        const { data } = await supabase
          .from("redes")
          .select("id,nome")
          .ilike("nome", like)
          .limit(perGroup);
        return group(
          "clientes",
          "Clientes",
          (data ?? []).map((r) => ({
            id: r.id as string,
            title: r.nome as string,
            href: `/clientes/${r.id}`,
          })),
        );
      })(),
    );
  }

  // Formulários
  tasks.push(
    (async (): Promise<Group | null> => {
      let qb = supabase
        .from("formularios")
        .select("id,nome,descricao")
        .eq("status", "ativo")
        .ilike("nome", like);
      if (!isSuper && redeId) qb = qb.eq("rede_id", redeId);
      const { data } = await qb.limit(perGroup);
      return group(
        "formularios",
        "Formulários",
        (data ?? []).map((f) => ({
          id: f.id as string,
          title: f.nome as string,
          subtitle: (f.descricao as string) ?? undefined,
          href: `/formularios/${f.id}`,
        })),
      );
    })(),
  );

  // Unidades
  tasks.push(
    (async (): Promise<Group | null> => {
      let qb = supabase
        .from("unidades")
        .select("id,nome,cidade,uf")
        .eq("status", "ativo")
        .ilike("nome", like);
      if (!isSuper && redeId) qb = qb.eq("rede_id", redeId);
      const { data } = await qb.limit(perGroup);
      return group(
        "unidades",
        "Unidades",
        (data ?? []).map((u) => ({
          id: u.id as string,
          title: u.nome as string,
          subtitle: [u.cidade, u.uf].filter(Boolean).join("/") || undefined,
          href: `/unidades`,
        })),
      );
    })(),
  );

  // Departamentos
  tasks.push(
    (async (): Promise<Group | null> => {
      let qb = supabase
        .from("departamentos")
        .select("id,nome")
        .eq("status", "ativo")
        .ilike("nome", like);
      if (!isSuper && redeId) qb = qb.eq("rede_id", redeId);
      const { data } = await qb.limit(perGroup);
      return group(
        "departamentos",
        "Departamentos",
        (data ?? []).map((d) => ({
          id: d.id as string,
          title: d.nome as string,
          href: `/configuracoes`,
        })),
      );
    })(),
  );

  // Usuários (gestores/admins do painel)
  tasks.push(
    (async (): Promise<Group | null> => {
      let qb = supabase
        .from("profiles")
        .select("id,nome,email")
        .or(`nome.ilike.${star},email.ilike.${star}`);
      if (!isSuper && redeId) qb = qb.eq("rede_id", redeId);
      const { data } = await qb.limit(perGroup);
      return group(
        "usuarios",
        "Usuários",
        (data ?? []).map((u) => ({
          id: u.id as string,
          title: (u.nome as string) || (u.email as string),
          subtitle: u.email as string,
          href: `/usuarios`,
        })),
      );
    })(),
  );

  // Equipe do app (membros da rede → identidades) — só admin da rede
  if (!isSuper && redeId) {
    tasks.push(
      (async (): Promise<Group | null> => {
        const { data } = await supabase
          .from("rede_membros")
          .select("id, identidades!inner(nome,email,cpf)")
          .eq("rede_id", redeId)
          .or(`nome.ilike.${star},email.ilike.${star},cpf.ilike.${star}`, {
            foreignTable: "identidades",
          })
          .limit(perGroup);
        const rows = (data ?? []) as unknown as {
          id: string;
          identidades: { nome: string; email: string | null } | null;
        }[];
        return group(
          "equipe",
          "Equipe do app",
          rows.map((r) => ({
            id: r.id,
            title: r.identidades?.nome ?? "—",
            subtitle: r.identidades?.email ?? undefined,
            href: `/configuracoes`,
          })),
        );
      })(),
    );
  }

  const ORDEM = [
    "clientes",
    "usuarios",
    "equipe",
    "formularios",
    "unidades",
    "departamentos",
  ];
  const groups = (await Promise.all(tasks))
    .filter((g): g is Group => g !== null)
    .sort((a, b) => ORDEM.indexOf(a.key) - ORDEM.indexOf(b.key));
  const total = groups.reduce((n, g) => n + g.hits.length, 0);
  return { groups, total };
}
