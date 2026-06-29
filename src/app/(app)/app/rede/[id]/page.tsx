import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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
    .select("rede_id, status, assinatura_svg, unidade_id, departamento_id, redes(nome), unidades(nome, tipo), cargos(nome)")
    .eq("id", id)
    .single();
  if (!membro) notFound();
  const m = membro as unknown as {
    rede_id: string;
    status: string;
    assinatura_svg: string | null;
    unidade_id: string | null;
    departamento_id: string | null;
    redes: { nome: string } | null;
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
  const diaJs = new Date().getDay(); // 0=Dom..6=Sáb
  const diaIso = diaJs === 0 ? 7 : diaJs; // 1=Seg..7=Dom
  const tipoUni = m.unidades?.tipo ?? null;

  const lista = ((forms ?? []) as Form[]).filter((f) => {
    if (tipoUni && f.tipo_unidade && f.tipo_unidade !== tipoUni) return false;

    const us = (f.formulario_unidades ?? []).map((x) => x.unidade_id);
    if (us.length && (!m.unidade_id || !us.includes(m.unidade_id))) return false;

    const ds = (f.formulario_departamentos ?? []).map((x) => x.departamento_id);
    if (ds.length && (!m.departamento_id || !ds.includes(m.departamento_id))) return false;

    const dias = f.dias_semana ?? [];
    if (dias.length && !dias.includes(diaIso)) return false;

    return true;
  });

  const unidade = m.unidades?.nome ?? m.redes?.nome ?? "Minha unidade";
  const subtitulo = [m.redes?.nome, m.cargos?.nome].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      {/* Banner de contexto da unidade */}
      <div className="bg-primary px-5 py-6 text-primary-foreground">
        <p className="text-lg font-bold leading-tight">{unidade}</p>
        {subtitulo && <p className="text-sm opacity-90">{subtitulo}</p>}
      </div>

      <div className="flex-1 space-y-3 p-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nenhum formulário disponível</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Quando o gestor liberar checklists para o seu acesso, eles aparecem aqui.
            </p>
          </div>
        ) : (
          lista.map((f) => (
            <Link
              key={f.id}
              href={`/app/rede/${id}/form/${f.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.nome}</p>
                {f.descricao && (
                  <p className="truncate text-xs text-muted-foreground">{f.descricao}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
