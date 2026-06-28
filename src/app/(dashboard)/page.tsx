import { Building2, Store, Users, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function safeCount(
  table: string,
  filter?: { col: string; val: string },
): Promise<number | null> {
  try {
    const supabase = await createClient();
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter.col, filter.val);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function VisaoGeralPage() {
  const profile = await getSessionProfile();
  const isSuper = profile?.papel === "super_admin";
  const redeFilter =
    !isSuper && profile?.rede_id
      ? { col: "rede_id", val: profile.rede_id }
      : undefined;

  const [redes, unidades, usuarios] = await Promise.all([
    isSuper ? safeCount("redes") : Promise.resolve(null),
    safeCount("unidades", redeFilter),
    safeCount("profiles", redeFilter),
  ]);

  const needsSetup = unidades === null;

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle={`Olá, ${profile?.nome?.split(" ")[0] || "bem-vindo"}! ${
          isSuper
            ? "Visão consolidada de todas as redes."
            : "Visão geral da sua rede."
        }`}
      />

      {needsSetup && (
        <Card className="mb-6 border-warning/40 bg-warning-bg">
          <CardContent>
            <p className="text-sm font-medium text-warning">
              Banco de dados ainda não configurado.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aplique as migrations do Supabase para ativar os dados. As telas já
              estão prontas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isSuper && (
          <Stat icon={Building2} label="Redes" value={String(redes ?? "—")} />
        )}
        <Stat
          icon={Store}
          label="Unidades"
          value={String(unidades ?? "—")}
        />
        <Stat icon={Users} label="Usuários" value={String(usuarios ?? "—")} />
        <Stat
          icon={ClipboardCheck}
          label="Checklists hoje"
          value="—"
        />
      </div>

      <Card className="mt-6">
        <CardContent>
          <h2 className="text-base font-semibold">Atividade recente</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Os envios de checklist aparecerão aqui assim que os gerentes
            começarem a usar o sistema.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
