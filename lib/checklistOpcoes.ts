import type { BadgeVariant } from "@/components/ui/Badge";
import type { ChecklistCor, ChecklistNivel, ChecklistStatus, ChecklistUrgencia } from "@/lib/types/shell";

/** Paleta fixa dos grupos; o banco guarda só o nome da cor. */
export const CORES_GRUPO: Array<{ value: ChecklistCor; label: string; classe: string }> = [
  { value: "azul", label: "Azul", classe: "bg-blue-500" },
  { value: "verde", label: "Verde", classe: "bg-emerald-500" },
  { value: "amarelo", label: "Amarelo", classe: "bg-yellow-400" },
  { value: "laranja", label: "Laranja", classe: "bg-orange-500" },
  { value: "vermelho", label: "Vermelho", classe: "bg-rose-500" },
  { value: "roxo", label: "Roxo", classe: "bg-violet-500" },
  { value: "rosa", label: "Rosa", classe: "bg-pink-400" },
  { value: "cinza", label: "Cinza", classe: "bg-slate-400" },
];

export const NIVEIS_ITEM: Array<{ value: ChecklistNivel; label: string; cor: BadgeVariant }> = [
  { value: 1, label: "Fácil", cor: "success" },
  { value: 2, label: "Médio", cor: "warning" },
  { value: 3, label: "Difícil", cor: "orange" },
];

export const URGENCIAS_ITEM: Array<{ value: ChecklistUrgencia; label: string; cor: BadgeVariant }> = [
  { value: 1, label: "Baixa", cor: "neutral" },
  { value: 2, label: "Média", cor: "warning" },
  { value: 3, label: "Alta", cor: "orange" },
  { value: 4, label: "Crítica", cor: "danger" },
];

export const STATUS_ITEM: Array<{ value: ChecklistStatus; label: string }> = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "feito", label: "Feito" },
];

export function classeCorGrupo(cor: string) {
  return CORES_GRUPO.find((c) => c.value === cor)?.classe ?? "bg-slate-400";
}

export const NIVEIS_COM_NENHUM: Array<{ value: ChecklistNivel | null; label: string }> = [
  { value: null, label: "Nenhum" },
  ...NIVEIS_ITEM,
];

export const URGENCIAS_COM_NENHUM: Array<{ value: ChecklistUrgencia | null; label: string }> = [
  { value: null, label: "Nenhum" },
  ...URGENCIAS_ITEM,
];

export const FILTRO_NIVEIS: Array<{ value: ChecklistNivel | null; label: string }> = [
  { value: null, label: "Sem nível" },
  ...NIVEIS_ITEM,
];

export const FILTRO_URGENCIAS: Array<{ value: ChecklistUrgencia | null; label: string }> = [
  { value: null, label: "Sem urgência" },
  ...URGENCIAS_ITEM,
];

export function opcaoNivel(nivel: number | null | undefined) {
  if (nivel == null) return undefined;
  return NIVEIS_ITEM.find((n) => n.value === nivel);
}

export function opcaoUrgencia(urgencia: number | null | undefined) {
  if (urgencia == null) return undefined;
  return URGENCIAS_ITEM.find((u) => u.value === urgencia);
}
