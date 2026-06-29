import { redirect } from "next/navigation";
import {
  Mail,
  CreditCard,
  Phone,
  MapPin,
  Building2,
  Store,
  Network,
  Briefcase,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMeuVinculo } from "@/lib/rede-branding";

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

  const [{ data: id }, m] = await Promise.all([
    supabase
      .from("identidades")
      .select("nome, email, cpf, celular, foto_url, cidade, uf")
      .eq("id", sub)
      .single(),
    getMeuVinculo(),
  ]);

  const PAPEL: Record<string, string> = {
    operador: "Operador",
    gestor: "Gestor",
    admin: "Administrador",
  };

  const iniciais =
    (id?.nome ?? "").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

  const linhas: [LucideIcon, string, string][] = [
    [Mail, "E-mail", id?.email ?? "—"],
    [CreditCard, "CPF", fmtCpf(id?.cpf ?? null)],
    [Phone, "Celular", id?.celular || "—"],
    [MapPin, "Cidade", id?.cidade ? `${id.cidade}${id.uf ? "/" + id.uf : ""}` : "—"],
  ];

  // Vínculo com a rede: unidade, departamento, cargo, acesso.
  const vinculo: [LucideIcon, string, string][] = [
    [Building2, "Rede", m?.rede ?? "—"],
    [Store, "Unidade", m?.unidade ?? "—"],
    [Network, "Departamento", m?.departamento ?? "—"],
    [Briefcase, "Cargo", m?.cargo ?? "—"],
    [ShieldCheck, "Acesso", m?.papel ? PAPEL[m.papel] ?? m.papel : "—"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
      <div className="mb-8 mt-2 flex flex-col items-center gap-3">
        {id?.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={id.foto_url}
            alt=""
            className="h-24 w-24 rounded-full border-4 border-card object-cover shadow-md"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-2xl font-semibold text-primary shadow-md">
            {iniciais}
          </div>
        )}
        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight">{id?.nome ?? "Usuário"}</p>
          {id?.email && (
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{id.email}</p>
          )}
        </div>
      </div>

      <Secao titulo="Dados Pessoais" linhas={linhas} />
      <Secao titulo="Vínculo Corporativo" linhas={vinculo} className="mt-6" />
    </div>
  );
}

function Secao({
  titulo,
  linhas,
  className = "",
}: {
  titulo: string;
  linhas: [LucideIcon, string, string][];
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="mb-2 ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {linhas.map(([Icon, k, v]) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-[13px] font-medium text-muted-foreground">{k}</span>
            <span className="max-w-[55%] truncate text-right text-sm font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
