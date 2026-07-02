import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getRedeMarcaById } from "@/lib/rede-branding";
import { AppAdminNav } from "@/components/app-admin-nav";
import { ToastProvider } from "@/components/toast";

// Console do ADMIN da rede no app (mobile). Só admin_supermercado; super admin e
// operadores não entram (o operador já é barrado no middleware).
export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (profile?.papel !== "admin_supermercado" || !profile.rede_id) {
    redirect("/");
  }

  const marca = await getRedeMarcaById(profile.rede_id);
  const cor = marca?.app_cor || marca?.cor_primaria || null;
  const style = cor
    ? ({
        "--primary": cor,
        "--primary-hover": `color-mix(in srgb, ${cor} 85%, black)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <ToastProvider>
      <div style={style} className="app-shell flex min-h-screen flex-col">
        <main
          className="flex flex-1 flex-col"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>
        <AppAdminNav />
      </div>
    </ToastProvider>
  );
}
