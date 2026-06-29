import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Perfil — Check.AI" };

function fmtCpf(cpf: string | null) {
  const d = (cpf ?? "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : "—";
}

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) redirect("/login");

  const [{ data: id }, { data: membro }] = await Promise.all([
    supabase
      .from("identidades")
      .select("nome, email, cpf, celular, foto_url, cidade, uf")
      .eq("id", sub)
      .single(),
    supabase
      .from("rede_membros")
      .select(
        "papel, redes(nome), unidades(nome), departamentos(nome), cargos(nome)",
      )
      .eq("identidade_id", sub)
      .eq("status", "ativo")
      .limit(1)
      .maybeSingle(),
  ]);

  const m = membro as {
    papel: string | null;
    redes: { nome: string } | null;
    unidades: { nome: string } | null;
    departamentos: { nome: string } | null;
    cargos: { nome: string } | null;
  } | null;

  const PAPEL: Record<string, string> = {
    operador: "Operador",
    gestor: "Gestor",
    admin: "Administrador",
  };

  const iniciais =
    (id?.nome ?? "").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

  const linhas: [string, string][] = [
    ["E-mail", id?.email ?? "—"],
    ["CPF", fmtCpf(id?.cpf ?? null)],
    ["Celular", id?.celular || "—"],
    ["Cidade", id?.cidade ? `${id.cidade}${id.uf ? "/" + id.uf : ""}` : "—"],
  ];

  // Vínculo com a rede: unidade, departamento, cargo, acesso.
  const vinculo: [string, string][] = [
    ["Rede", m?.redes?.nome ?? "—"],
    ["Unidade", m?.unidades?.nome ?? "—"],
    ["Departamento", m?.departamentos?.nome ?? "—"],
    ["Cargo", m?.cargos?.nome ?? "—"],
    ["Acesso", m?.papel ? PAPEL[m.papel] ?? m.papel : "—"],
  ];

  return (
    <div className="flex flex-1 flex-col items-center p-5">
      <div className="flex flex-col items-center gap-3 py-4">
        {id?.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={id.foto_url} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {iniciais}
          </div>
        )}
        <p className="text-lg font-semibold">{id?.nome ?? "Usuário"}</p>
      </div>

      <div className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-card">
        {linhas.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="truncate text-right font-medium">{v}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-2 w-full max-w-sm px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Vínculo
      </p>
      <div className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-card">
        {vinculo.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="truncate text-right font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
