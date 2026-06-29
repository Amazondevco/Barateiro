// Filtro de acesso do ícone: vazio numa dimensão = vale para todos.
export type AppIcone = {
  id: string;
  nome: string;
  nomeCurto: string;
  cor: string;
  cargos: string[];
  unidades: string[];
  departamentos: string[];
};

export type Opt = { id: string; nome: string };

export type RosterPessoa = {
  id: string;
  nome: string;
  status: string;
  cargo_id: string | null;
  unidade_id: string | null;
  departamento_id: string | null;
};

// vazio numa dimensão = todos
function matchDim(pessoaId: string | null, filtro: string[]) {
  if (filtro.length === 0) return true;
  return pessoaId !== null && filtro.includes(pessoaId);
}

export function pessoaCasaIcone(p: RosterPessoa, icone: AppIcone) {
  return (
    matchDim(p.cargo_id, icone.cargos) &&
    matchDim(p.unidade_id, icone.unidades) &&
    matchDim(p.departamento_id, icone.departamentos)
  );
}
