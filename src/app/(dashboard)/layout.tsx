import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionContext } from "@/lib/auth";

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
