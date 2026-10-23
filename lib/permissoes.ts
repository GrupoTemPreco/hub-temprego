export type PermissaoKey =
  | "analytics.estoque"
  | "analytics.contas_a_pagar"
  | "analytics.compras"
  | "checklist.preencher"
  | "checklist.preencher_supervisao"
  | "checklist.analise"
  | "rh.monitoramento";

export type PermissaoDisponivel = {
  key: PermissaoKey;
  label: string;
  modulo: string;
  item: string;
};

export const PERMISSOES_DISPONIVEIS: PermissaoDisponivel[] = [
  {
    key: "analytics.estoque",
    label: "Analytics > Estoque",
    modulo: "analytics",
    item: "estoque",
  },
  {
    key: "analytics.contas_a_pagar",
    label: "Analytics > Contas a Pagar",
    modulo: "analytics",
    item: "contas_a_pagar",
  },
  {
    key: "analytics.compras",
    label: "Analytics > Compras",
    modulo: "analytics",
    item: "compras",
  },
  {
    key: "checklist.preencher",
    label: "Checklist > Preencher",
    modulo: "checklist",
    item: "preencher",
  },
  {
    key: "checklist.preencher_supervisao",
    label: "Checklist > Preencher Supervisão",
    modulo: "checklist",
    item: "preencher_supervisao",
  },
  {
    key: "checklist.analise",
    label: "Checklist > Análise",
    modulo: "checklist",
    item: "analise",
  },
  {
    key: "rh.monitoramento",
    label: "RH > Monitoramento de tarefas",
    modulo: "rh",
    item: "monitoramento",
  },
];

export type PermissoesMarcadas = Record<PermissaoKey, boolean>;

export function permissoesVazias(): PermissoesMarcadas {
  return Object.fromEntries(PERMISSOES_DISPONIVEIS.map((p) => [p.key, false])) as PermissoesMarcadas;
}

export type GrupoPermissoes = {
  modulo: string;
  titulo: string;
  itens: Array<PermissaoDisponivel & { itemLabel: string }>;
};

/** Agrupa o catálogo pelo módulo (o prefixo antes de " > " no label). */
export function agruparPermissoes(): GrupoPermissoes[] {
  const grupos = new Map<string, GrupoPermissoes>();
  for (const p of PERMISSOES_DISPONIVEIS) {
    const [titulo, itemLabel] = p.label.split(" > ");
    if (!grupos.has(p.modulo)) grupos.set(p.modulo, { modulo: p.modulo, titulo, itens: [] });
    grupos.get(p.modulo)!.itens.push({ ...p, itemLabel: itemLabel ?? p.label });
  }
  return [...grupos.values()];
}
