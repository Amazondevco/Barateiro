// Tipos de negócio (segmentos) da rede-cliente. O sistema é genérico para
// qualquer empresa que use checklists. Cada tipo tem um `descritor` — a frase
// que os prompts de IA usam como contexto do ramo (geração de checklist e
// relatórios). `usaGondola` marca ramos com abastecimento de gôndola/estoque
// (onde faz sentido o tipo de item "abastecido/ruptura").

export type TipoNegocio = {
  slug: string;
  label: string;
  descritor: string;
  usaGondola?: boolean;
};

export const TIPOS_NEGOCIO: TipoNegocio[] = [
  { slug: "seguranca", label: "Segurança patrimonial", descritor: "uma empresa de segurança patrimonial e vigilância (rondas, postos de serviço, controle de acesso, equipamentos)" },
  { slug: "transporte", label: "Transporte / Logística", descritor: "uma empresa de transporte e logística (coletas, entregas, rotas, expedição, conferência de carga)" },
  { slug: "frota", label: "Frota / Veículos", descritor: "gestão de frota de veículos (inspeção veicular, saída e retorno, manutenção, documentação)" },
  { slug: "industria", label: "Indústria / Manufatura", descritor: "uma indústria/manufatura (linha de produção, máquinas, segurança do trabalho, qualidade)" },
  { slug: "supermercado", label: "Supermercado / Varejo alimentar", descritor: "um supermercado / varejo alimentar (gôndolas, abastecimento, validade, temperatura, hortifrúti, açougue, padaria)", usaGondola: true },
  { slug: "varejo", label: "Varejo (lojas)", descritor: "um varejo em geral (loja, vitrine, estoque, atendimento, PDV)", usaGondola: true },
  { slug: "restaurante", label: "Restaurante / Food service", descritor: "um restaurante / food service (cozinha, boas práticas de manipulação, salão, estoque)" },
  { slug: "hotelaria", label: "Hotelaria", descritor: "um hotel / hotelaria (quartos, limpeza, recepção, áreas comuns, manutenção)" },
  { slug: "saude", label: "Saúde / Clínicas", descritor: "uma unidade de saúde (clínica/hospital: higienização, equipamentos, insumos, protocolos)" },
  { slug: "farmacia", label: "Farmácia / Drogaria", descritor: "uma farmácia / drogaria (validade, temperatura, controlados, gôndola, atendimento)", usaGondola: true },
  { slug: "construcao", label: "Construção civil / Obras", descritor: "uma obra / construção civil (frente de trabalho, EPIs, segurança, equipamentos)" },
  { slug: "facilities", label: "Facilities / Limpeza", descritor: "uma empresa de facilities / limpeza e conservação (rotinas de limpeza, insumos, áreas)" },
  { slug: "condominios", label: "Condomínios / Portaria", descritor: "um condomínio / portaria (ronda, controle de acesso, áreas comuns, equipamentos)" },
  { slug: "educacao", label: "Educação / Escolas", descritor: "uma escola / instituição de ensino (salas, limpeza, segurança, refeitório, equipamentos)" },
  { slug: "agro", label: "Agronegócio / Fazendas", descritor: "um agronegócio / fazenda (lavoura, currais, máquinas agrícolas, armazenagem, insumos)" },
  { slug: "postos", label: "Postos de combustível", descritor: "um posto de combustível (bombas, tanques, loja de conveniência, segurança, meio ambiente)", usaGondola: true },
  { slug: "academias", label: "Academias / Fitness", descritor: "uma academia / centro fitness (equipamentos, limpeza, vestiários, atendimento)" },
  { slug: "eventos", label: "Eventos", descritor: "uma operação de eventos (montagem, segurança, equipamentos, staff, abertura e fechamento)" },
  { slug: "manutencao-predial", label: "Manutenção predial", descritor: "manutenção predial (elétrica, hidráulica, elevadores, climatização, preventivas)" },
  { slug: "frigorifico", label: "Frigorífico / Alimentos", descritor: "um frigorífico / processamento de alimentos (temperatura, higiene, câmaras frias, rastreabilidade)" },
  { slug: "distribuidora", label: "Distribuidora / Atacado", descritor: "uma distribuidora / atacado (armazém, separação, expedição, estoque, validade)", usaGondola: true },
  { slug: "energia", label: "Óleo & gás / Energia", descritor: "uma operação de óleo & gás / energia (operação de campo, segurança, equipamentos, meio ambiente)" },
  { slug: "mineracao", label: "Mineração", descritor: "uma mineradora (frente de lavra, equipamentos pesados, segurança, meio ambiente)" },
  { slug: "automotivo", label: "Automotivo / Oficinas", descritor: "uma oficina / operação automotiva (recepção do veículo, serviços, peças, entrega, qualidade)" },
  { slug: "petshop", label: "Petshop / Veterinária", descritor: "um petshop / clínica veterinária (banho e tosa, loja, clínica, higiene, estoque)", usaGondola: true },
  { slug: "estetica", label: "Estética / Salão", descritor: "um salão / clínica de estética (higienização, equipamentos, atendimento, insumos)" },
  { slug: "telecom", label: "Telecom", descritor: "uma operação de telecom (instalações, sites/torres, equipamentos de rede, atendimento em campo)" },
  { slug: "financeiro", label: "Bancário / Financeiro", descritor: "uma agência bancária / financeira (autoatendimento, segurança, atendimento, conformidade)" },
  { slug: "laboratorio", label: "Laboratório", descritor: "um laboratório (coleta, equipamentos, insumos, biossegurança, qualidade)" },
  { slug: "outro", label: "Outro", descritor: "operações gerais da empresa" },
];

const MAP: Record<string, TipoNegocio> = Object.fromEntries(
  TIPOS_NEGOCIO.map((t) => [t.slug, t]),
);

const OUTRO = MAP["outro"];

export function tipoNegocio(slug?: string | null): TipoNegocio {
  return (slug && MAP[slug]) || OUTRO;
}

// Rótulo do tipo (para exibir a tag). Nulo se não houver.
export function labelNegocio(slug?: string | null): string | null {
  return slug ? MAP[slug]?.label ?? null : null;
}

// Descritor do ramo para os prompts de IA (cai no genérico se vazio/desconhecido).
export function descritorNegocio(slug?: string | null): string {
  return tipoNegocio(slug).descritor;
}

export function usaGondola(slug?: string | null): boolean {
  return Boolean(tipoNegocio(slug).usaGondola);
}
