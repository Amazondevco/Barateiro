import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssinarForm } from "./assinar-form";

export const metadata = { title: "Sua assinatura — Barateiro" };

export default async function AssinarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: membro } = await supabase
    .from("rede_membros")
    .select("assinatura_svg, redes(nome)")
    .eq("id", id)
    .single();
  if (!membro) notFound();

  const m = membro as unknown as {
    assinatura_svg: string | null;
    redes: { nome: string } | null;
  };
  // já assinou → não precisa repetir
  if (m.assinatura_svg) redirect(`/app/rede/${id}`);

  return <AssinarForm membroId={id} redeNome={m.redes?.nome ?? "sua rede"} />;
}
