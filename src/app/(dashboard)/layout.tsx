import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionContext } from "@/lib/auth";

// Favicon da aba = logo da rede grande, sem moldura cinza (gerado em
// /api/favicon: logo em fundo transparente ocupando quase todo o quadro).
export async function generateMetadata(): Promise<Metadata> {
  const { rede } = await getSessionContext();
  const icon = rede?.id
    ? `/api/favicon?rede=${rede.id}`
    : rede?.favicon_url ?? rede?.logo_url ?? "/icon.svg";
  return {
    title: rede?.nome ?? "Check.AI",
    icons: { icon },
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, rede } = await getSessionContext();
  if (!profile) redirect("/login");

  return (
    <DashboardShell profile={profile} rede={rede}>
      {children}
    </DashboardShell>
  );
}
