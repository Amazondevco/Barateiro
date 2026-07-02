import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { SugestoesList, type SugestaoItem } from "./sugestoes-list";

export const metadata = { title: "Sugestões — Check.AI" };

export default async function SugestoesPage() {
  const profile = await getSessionProfile();
  if (profile?.papel !== "super_admin" && profile?.papel !== "admin_supermercado")
    redirect("/");

  const supabase = await createClient();
  // RLS já entrega só o que este papel pode ver:
  // admin → 'rede' da sua rede; super admin → 'plataforma' (escaladas).
  const { data: sugestoes } = await supabase
    .from("sugestoes")
    .select("id, autor_nome, texto, audio_url, status, criado_em")
    .order("criado_em", { ascending: false });

  type Sug = {
    id: string;
    autor_nome: string;
    texto: string;
    audio_url: string | null;
    status: string;
    criado_em: string;
  };
  const lista = (sugestoes ?? []) as Sug[];

  // URLs assinadas para os áudios (bucket privado). Usa o admin client porque o
  // bucket `sugestoes` não tem policy de leitura — a autorização de quem vê a
  // sugestão já foi feita pela RLS da tabela acima.
  const admin = createAdminClient();
  const audioUrls: Record<string, string> = {};
  await Promise.all(
    lista
      .filter((s) => s.audio_url)
      .map(async (s) => {
        const { data } = await admin.storage
          .from("sugestoes")
          .createSignedUrl(s.audio_url!, 3600);
        if (data?.signedUrl) audioUrls[s.id] = data.signedUrl;
      }),
  );

  const superAdmin = profile.papel === "super_admin";
  const titulo = superAdmin ? "Sugestões das redes" : "Sugestões da equipe";

  const items: SugestaoItem[] = lista.map((s) => ({
    id: s.id,
    autor: s.autor_nome,
    texto: s.texto,
    audioUrl: audioUrls[s.id] ?? null,
    status: s.status,
    criadoEm: s.criado_em,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Sugestões" subtitle={titulo} crumb="Sugestões" />
      <SugestoesList
        sugestoes={items}
        podeEscalar={!superAdmin}
        emptyDescription={
          superAdmin
            ? "As sugestões escaladas pelas redes aparecem aqui."
            : "As sugestões da sua equipe aparecem aqui."
        }
      />
    </div>
  );
}
