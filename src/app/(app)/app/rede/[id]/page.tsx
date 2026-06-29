import { notFound, redirect } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRedeMarcaById } from "@/lib/rede-branding";
import { AddToHome } from "@/components/add-to-home";
import { FormsBoard, type FormItem } from "./forms-board";

export const metadata = { title: "Meu app — Check.AI" };

// true se a cor (hex) for clara → usar texto escuro por cima
function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}

export default async function AppRedePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;

  const { data: membro } = await supabase
    .from("rede_membros")
    .select(
      "rede_id, status, assinatura_svg, unidade_id, departamento_id, unidades(nome, tipo), cargos(nome)",
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
    unidades: { nome: string; tipo: string } | null;
    cargos: { nome: string } | null;
  };

  // Marca da rede (logo/banner/cor) via service role — RLS de redes não
  // enxerga membros do app. Escopada à rede do próprio membro.
  const marca = await getRedeMarcaById(m.rede_id);

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

  // Quais formulários este usuário já enviou hoje (para o filtro pendente/enviado).
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: enviadasHoje } = await supabase
    .from("respostas")
    .select("formulario_id")
    .eq("usuario_id", sub ?? "")
    .eq("data_referencia", hoje);
  const enviados = new Set(
    (enviadasHoje ?? []).map((r) => (r as { formulario_id: string }).formulario_id),
  );

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
    .map((f) => ({
      id: f.id,
      nome: f.nome,
      descricao: f.descricao,
      enviadoHoje: enviados.has(f.id),
    }));

  const cor = marca?.app_cor || marca?.cor_primaria || "#0f172a";
  const redeNome = marca?.nome ?? "Minha rede";
  // Fundo = cor sólida do Admin. Texto adapta (escuro em cor clara).
  const textoCor = isLightHex(cor) ? "#0f172a" : "#ffffff";
  const bannerStyle: React.CSSProperties = { background: cor, color: textoCor };

  return (
    <div className="flex flex-1 flex-col">
      {/* Banner da REDE: cor sólida do Admin + logo + nome centralizados */}
      <div className="relative px-5 pb-7 pt-4" style={bannerStyle}>
        <div className="flex flex-col items-center gap-2.5 pt-2">
          {marca?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marca.logo_url}
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
            <p className="text-sm opacity-80">
              {[m.unidades?.nome, m.cargos?.nome].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4">
        <AddToHome compact />
        <FormsBoard membroId={id} forms={lista} />
      </div>
    </div>
  );
}
