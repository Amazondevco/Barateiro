import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { SugestaoCard } from "./sugestao-card";

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

  // URLs assinadas para os áudios (bucket privado)
  const audioUrls: Record<string, string> = {};
  await Promise.all(
    lista
      .filter((s) => s.audio_url)
      .map(async (s) => {
        const { data } = await supabase.storage
          .from("sugestoes")
          .createSignedUrl(s.audio_url!, 3600);
        if (data?.signedUrl) audioUrls[s.id] = data.signedUrl;
      }),
  );

  const titulo =
    profile.papel === "super_admin"
      ? "Sugestões das redes"
      : "Sugestões da equipe";

  return (
    <div className="space-y-4">
      <PageHeader title="Sugestões" crumb="Sugestões" />
      <p className="text-sm text-muted-foreground">{titulo}</p>

      {lista.length === 0 ? (
        <EmptyState
          title="Nenhuma sugestão"
          description={
            profile.papel === "super_admin"
              ? "As sugestões escaladas pelas redes aparecem aqui."
              : "As sugestões da sua equipe aparecem aqui."
          }
        />
      ) : (
        <div className="space-y-3">
          {lista.map((s) => (
            <SugestaoCard
              key={s.id}
              id={s.id}
              autor={s.autor_nome}
              texto={s.texto}
              audioUrl={audioUrls[s.id] ?? null}
              status={s.status}
              criadoEm={s.criado_em}
            />
          ))}
        </div>
      )}
    </div>
  );
}
