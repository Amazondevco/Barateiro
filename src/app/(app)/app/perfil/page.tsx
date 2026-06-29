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

  const { data: id } = await supabase
    .from("identidades")
    .select("nome, email, cpf, celular, foto_url, cidade, uf")
    .eq("id", sub)
    .single();

  const iniciais =
    (id?.nome ?? "").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

  const linhas: [string, string][] = [
    ["E-mail", id?.email ?? "—"],
    ["CPF", fmtCpf(id?.cpf ?? null)],
    ["Celular", id?.celular || "—"],
    ["Cidade", id?.cidade ? `${id.cidade}${id.uf ? "/" + id.uf : ""}` : "—"],
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
          <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
