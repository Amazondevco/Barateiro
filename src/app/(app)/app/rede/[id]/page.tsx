import { notFound, redirect } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppDrawer } from "@/components/app-drawer";
import { FormsBoard, type FormItem } from "./forms-board";

export const metadata = { title: "Meu app — Check.AI" };

export default async function AppRedePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: membro } = await supabase
    .from("rede_membros")
    .select(
      "rede_id, status, assinatura_svg, unidade_id, departamento_id, redes(nome, logo_url, cor_primaria, banner_url), unidades(nome, tipo), cargos(nome)",
    )
    .eq("id", id)
    .single();
  if (!membro) notFound();
  const m = membro as unknown as {
    rede_id: string;
    status: string;
    assinatura_svg: string | null;
    unidade_id: string | null;
    departamento_id: string | null;
    redes: { nome: string; logo_url: string | null; cor_primaria: string | null; banner_url: string | null } | null;
    unidades: { nome: string; tipo: string } | null;
    cargos: { nome: string } | null;
  };

  // 1º acesso: ainda não adotou a assinatura → adota antes dos formulários.
  if (!m.assinatura_svg) redirect(`/app/rede/${id}/assinar`);

  const { data: forms } = await supabase
    .from("formularios")
    .select(
      "id, nome, descricao, tipo_unidade, dias_semana, formulario_unidades(unidade_id), formulario_departamentos(departamento_id)",
    )
    .eq("rede_id", m.rede_id)
    .eq("status", "ativo")
    .order("nome");

  type Form = {
    id: string;
    nome: string;
    descricao: string | null;
    tipo_unidade: string | null;
    dias_semana: number[] | null;
    formulario_unidades: { unidade_id: string }[];
    formulario_departamentos: { departamento_id: string }[];
  };

  // Segmentação: formulário aparece se casa com unidade/tipo, departamento e dia.
  const diaJs = new Date().getDay();
  const diaIso = diaJs === 0 ? 7 : diaJs;
  const tipoUni = m.unidades?.tipo ?? null;

  const lista: FormItem[] = ((forms ?? []) as Form[])
    .filter((f) => {
      if (tipoUni && f.tipo_unidade && f.tipo_unidade !== tipoUni) return false;
      const us = (f.formulario_unidades ?? []).map((x) => x.unidade_id);
      if (us.length && (!m.unidade_id || !us.includes(m.unidade_id))) return false;
      const ds = (f.formulario_departamentos ?? []).map((x) => x.departamento_id);
      if (ds.length && (!m.departamento_id || !ds.includes(m.departamento_id))) return false;
      const dias = f.dias_semana ?? [];
      if (dias.length && !dias.includes(diaIso)) return false;
      return true;
    })
    .map((f) => ({ id: f.id, nome: f.nome, descricao: f.descricao }));

  const cor = m.redes?.cor_primaria || "var(--primary)";
  const redeNome = m.redes?.nome ?? "Minha rede";
  const banner = m.redes?.banner_url;
  const bannerStyle: React.CSSProperties = banner
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.5)), url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: cor };

  return (
    <div className="flex flex-1 flex-col">
      {/* Banner da REDE: hambúrguer + logo + nome centralizados */}
      <div className="relative px-5 pb-7 pt-3 text-white" style={bannerStyle}>
        <div className="absolute left-2 top-3">
          <AppDrawer nome={redeNome} />
        </div>
        <div className="flex flex-col items-center gap-2.5 pt-2">
          {m.redes?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.redes.logo_url}
              alt={redeNome}
              className="h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-md"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15">
              <Store className="h-9 w-9" />
            </span>
          )}
          <p className="text-2xl font-bold tracking-tight">{redeNome}</p>
          {(m.unidades?.nome || m.cargos?.nome) && (
            <p className="text-sm text-white/85">
              {[m.unidades?.nome, m.cargos?.nome].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        <FormsBoard membroId={id} forms={lista} />
      </div>
    </div>
  );
}
