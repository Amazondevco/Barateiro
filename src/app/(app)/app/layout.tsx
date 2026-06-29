import { createClient } from "@/lib/supabase/server";
import { AppChrome } from "@/components/app-chrome";

export default async function AppLoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const c = claims?.claims as { sub?: string; email?: string } | undefined;
  let nome: string | undefined;
  if (c?.sub) {
    const { data } = await supabase
      .from("identidades")
      .select("nome")
      .eq("id", c.sub)
      .maybeSingle();
    nome = data?.nome ?? undefined;
  }

  return (
    <AppChrome nome={nome} email={c?.email ?? ""}>
      {children}
    </AppChrome>
  );
}
