import { createClient } from "@/lib/supabase/server";
import { RegistroRedeForm, type ConviteInfo } from "./registro-form";

export const metadata = { title: "Entrar na rede — Check.AI" };

export default async function RegistroRedePage({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string }>;
}) {
  const { convite } = await searchParams;

  // Busca o convite NO SERVIDOR (sem depender de JS/hidratação no cliente).
  let info: ConviteInfo | null = null;
  if (convite) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("convite_info", { p_token: convite });
    info = (data?.[0] as ConviteInfo) ?? null;
  }

  return <RegistroRedeForm token={convite ?? null} convite={info} />;
}
