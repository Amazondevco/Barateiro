import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionContext } from "@/lib/auth";

// Favicon da aba = logo da rede (ou da plataforma p/ super admin)
export async function generateMetadata(): Promise<Metadata> {
  const { rede } = await getSessionContext();
  return {
    title: rede?.nome ?? "Amazon Dev & Co.",
    icons: rede?.logo_url ? { icon: rede.logo_url } : undefined,
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
