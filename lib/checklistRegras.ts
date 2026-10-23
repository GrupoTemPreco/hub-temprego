import { FUSO } from "@/lib/datas";
import type { ChecklistItem, ChecklistNivel, ChecklistUrgencia } from "@/lib/types/shell";

// ---------------------------------------------------------------------------
// Ordem fracionária
// ---------------------------------------------------------------------------

/** Média dos vizinhos; no topo, o primeiro menos 1; no fim, o último mais 1. */
export function ordemEntre(anterior: number | undefined, proximo: number | undefined): number {
  if (anterior === undefined && proximo === undefined) return 1;
  if (anterior === undefined) return proximo! - 1;
  if (proximo === undefined) return anterior + 1;
  return (anterior + proximo) / 2;
}

/** Ordem de quem entra na posição `indice` de `lista` (que não deve conter o próprio elemento). */
export function ordemNaPosicao(lista: Array<{ ordem: number }>, indice: number) {
  return ordemEntre(lista[indice - 1]?.ordem, lista[indice]?.ordem);
}

export function ordemNoFim(lista: Array<{ ordem: number }>) {
  if (lista.length === 0) return 1;
  return Math.max(...lista.map((x) => x.ordem)) + 1;
}

// ---------------------------------------------------------------------------
// Prazo (coluna date, sem fuso)
// ---------------------------------------------------------------------------

const DIAS_AVISO_PRAZO = 2;

const formatadorDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Hoje em São Paulo, no formato YYYY-MM-DD. */
export function hojeSP(agora = new Date()) {
  return formatadorDia.format(agora);
}

function diaUtc(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export type SituacaoPrazo = "vencido" | "proximo" | "normal";

export function situacaoPrazo(prazo: string, hoje = hojeSP()): SituacaoPrazo {
  const dias = Math.round((diaUtc(prazo) - diaUtc(hoje)) / 86_400_000);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_AVISO_PRAZO) return "proximo";
  return "normal";
}

/** "2026-10-23" -> "23/10" */
export function formatarPrazo(prazo: string) {
  const [, mes, dia] = prazo.split("-");
  return `${dia}/${mes}`;
}

// ---------------------------------------------------------------------------
// Filtros e ordenação
// ---------------------------------------------------------------------------

export type OrdenacaoChecklist = "manual" | "urgencia" | "prazo";

export type FiltrosChecklist = {
  busca: string;
  urgencias: ChecklistUrgencia[];
  niveis: ChecklistNivel[];
  soComPrazo: boolean;
  esconderConcluidos: boolean;
  ordenacao: OrdenacaoChecklist;
};

export const FILTROS_PADRAO: FiltrosChecklist = {
  busca: "",
  urgencias: [],
  niveis: [],
  soComPrazo: false,
  esconderConcluidos: true,
  ordenacao: "manual",
};

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function passaNoFiltro(item: ChecklistItem, filtros: FiltrosChecklist) {
  const busca = normalizar(filtros.busca.trim());
  if (busca && !normalizar(`${item.titulo} ${item.observacao ?? ""}`).includes(busca)) return false;
  if (filtros.urgencias.length > 0 && !filtros.urgencias.includes(item.urgencia)) return false;
  if (filtros.niveis.length > 0 && !filtros.niveis.includes(item.nivel)) return false;
  if (filtros.soComPrazo && !item.prazo) return false;
  return true;
}

/** Prazo mais próximo primeiro; sem prazo vai para o fim. */
function compararPrazo(a: ChecklistItem, b: ChecklistItem) {
  if (a.prazo === b.prazo) return 0;
  if (!a.prazo) return 1;
  if (!b.prazo) return -1;
  return a.prazo < b.prazo ? -1 : 1;
}

export function ordenarItens(itens: ChecklistItem[], ordenacao: OrdenacaoChecklist) {
  const porOrdem = (a: ChecklistItem, b: ChecklistItem) => a.ordem - b.ordem;
  if (ordenacao === "urgencia") return [...itens].sort((a, b) => b.urgencia - a.urgencia || porOrdem(a, b));
  if (ordenacao === "prazo") return [...itens].sort((a, b) => compararPrazo(a, b) || porOrdem(a, b));
  return [...itens].sort(porOrdem);
}

const URGENCIA_CRITICA = 4;

/** Números e destaques do card "Meu checklist". */
export function resumoPendentes(itens: ChecklistItem[], limite = 3, hoje = hojeSP()) {
  const pendentes = itens.filter((i) => i.status !== "feito");
  return {
    total: pendentes.length,
    criticos: pendentes.filter((i) => i.urgencia === URGENCIA_CRITICA).length,
    vencendo: pendentes.filter((i) => i.prazo && situacaoPrazo(i.prazo, hoje) !== "normal").length,
    destaques: [...pendentes].sort((a, b) => b.urgencia - a.urgencia || compararPrazo(a, b)).slice(0, limite),
  };
}

export type VisaoGrupo = {
  /** Pendentes que passam no filtro, já ordenados. */
  pendentes: ChecklistItem[];
  /** Feitos que passam no filtro; vazio quando "esconder concluídos" está ligado. */
  concluidos: ChecklistItem[];
  /** Pendentes do grupo, sem considerar filtros. */
  totalPendentes: number;
};

export function montarVisao(grupoIds: string[], itens: ChecklistItem[], filtros: FiltrosChecklist) {
  const visao = new Map<string, VisaoGrupo>(
    grupoIds.map((id) => [id, { pendentes: [], concluidos: [], totalPendentes: 0 }]),
  );
  for (const item of itens) {
    const grupo = visao.get(item.grupo_id);
    if (!grupo) continue;
    const feito = item.status === "feito";
    if (!feito) grupo.totalPendentes += 1;
    if (!passaNoFiltro(item, filtros)) continue;
    if (!feito) grupo.pendentes.push(item);
    else if (!filtros.esconderConcluidos) grupo.concluidos.push(item);
  }
  for (const grupo of visao.values()) {
    grupo.pendentes = ordenarItens(grupo.pendentes, filtros.ordenacao);
    grupo.concluidos = ordenarItens(grupo.concluidos, "manual");
  }
  return visao;
}
