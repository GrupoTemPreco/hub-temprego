import type { SetorLista } from "@/lib/admin/setores";

export type FiltroSetor = "todos" | "ativos" | "inativos" | "sem-responsavel";

export const OPCOES_FILTRO_SETOR: Array<{ value: FiltroSetor; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
  { value: "sem-responsavel", label: "Sem responsável" },
];

export function parseFiltroSetor(valor: string | null): FiltroSetor {
  return OPCOES_FILTRO_SETOR.some((o) => o.value === valor) ? (valor as FiltroSetor) : "todos";
}

export function filtrarSetores(setores: SetorLista[], busca: string, filtro: FiltroSetor) {
  const termo = busca.trim().toLowerCase();
  return setores.filter((s) => {
    if (filtro === "ativos" && !s.ativo) return false;
    if (filtro === "inativos" && s.ativo) return false;
    if (filtro === "sem-responsavel" && s.responsavel_id) return false;
    return !termo || s.nome.toLowerCase().includes(termo);
  });
}
