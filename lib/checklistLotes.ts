import type { ChecklistEnvio, ChecklistEnvioModo } from "@/lib/types/shell";

/** Situação geral de um envio (todos os destinatários do lote juntos). */
export type StatusLote = "aguardando" | "aceito" | "recusado" | "cancelado";

/** Campos comuns aos envios de tarefa e de lista; bastam para agrupar por lote. */
export type EnvioDoLote = Pick<
  ChecklistEnvio,
  | "id"
  | "lote_id"
  | "setor_id"
  | "para_usuario_id"
  | "mensagem"
  | "status"
  | "resposta"
  | "reenvios"
  | "reenviado_em"
  | "ciente_em"
  | "criado_em"
>;

export type LoteDe<E extends EnvioDoLote> = {
  /** lote_id; envios antigos, sem lote, usam o próprio id. */
  id: string;
  setorId: string | null;
  mensagem: string | null;
  /** Um por destinatário, na ordem em que foram criados. */
  envios: E[];
  pendentes: E[];
  recusados: E[];
  aceito: E | null;
  status: StatusLote;
  criadoEm: string;
  /** Último envio ou reenvio do lote (base do intervalo de 30 minutos). */
  ultimoEnvioEm: string;
  reenvios: number;
  /** Quem enviou já deu "Ok" na resposta (aceite ou recusa de todos). */
  ciente: boolean;
};

export type LoteEnvio = LoteDe<ChecklistEnvio> & {
  itemId: string | null;
  titulo: string;
  prazoSugerido: string | null;
  modo: ChecklistEnvioModo;
};

export const idDoLote = (e: Pick<EnvioDoLote, "id" | "lote_id">) => e.lote_id ?? e.id;

/**
 * Aceite manda em tudo; senão, aguardando enquanto houver pendente; cancelado se o envio foi cancelado;
 * recusado só quando todos recusaram (sem pendente e sem aceito).
 */
export function statusDoLote(envios: Pick<EnvioDoLote, "status">[]): StatusLote {
  if (envios.some((e) => e.status === "aceito")) return "aceito";
  if (envios.some((e) => e.status === "pendente")) return "aguardando";
  if (envios.some((e) => e.status === "cancelado")) return "cancelado";
  return "recusado";
}

export function montarLoteBase<E extends EnvioDoLote>(id: string, envios: E[]): LoteDe<E> {
  const ordenados = [...envios].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const [primeiro] = ordenados;
  const status = statusDoLote(ordenados);
  const aceito = ordenados.find((e) => e.status === "aceito") ?? null;
  const recusados = ordenados.filter((e) => e.status === "recusado");
  return {
    id,
    setorId: primeiro.setor_id,
    mensagem: primeiro.mensagem,
    envios: ordenados,
    pendentes: ordenados.filter((e) => e.status === "pendente"),
    recusados,
    aceito,
    status,
    criadoEm: primeiro.criado_em,
    ultimoEnvioEm: ordenados.map((e) => e.reenviado_em ?? e.criado_em).sort().pop()!,
    reenvios: Math.max(...ordenados.map((e) => e.reenvios)),
    ciente: status === "aceito" ? Boolean(aceito?.ciente_em) : recusados.every((e) => e.ciente_em),
  };
}

function montarLote(id: string, envios: ChecklistEnvio[]): LoteEnvio {
  const base = montarLoteBase(id, envios);
  const [primeiro] = base.envios;
  return {
    ...base,
    itemId: primeiro.item_id,
    titulo: primeiro.titulo,
    prazoSugerido: primeiro.prazo_sugerido,
    modo: primeiro.modo ?? "primeiro",
  };
}

/** Envios agrupados por lote, do mais novo para o mais antigo. */
export function agruparPorLote<E extends EnvioDoLote, L extends { criadoEm: string }>(
  envios: E[],
  montar: (id: string, lista: E[]) => L,
): L[] {
  const porLote = new Map<string, E[]>();
  for (const e of envios) porLote.set(idDoLote(e), [...(porLote.get(idDoLote(e)) ?? []), e]);
  return [...porLote.entries()].map(([id, lista]) => montar(id, lista)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export function agruparLotes(envios: ChecklistEnvio[]): LoteEnvio[] {
  return agruparPorLote(envios, montarLote);
}

/** Lote mais recente de cada item; é ele que decide se o item está aguardando ou recusado. */
export function ultimoLotePorItem(lotes: LoteEnvio[]) {
  const mapa = new Map<string, LoteEnvio>();
  for (const l of lotes) {
    if (!l.itemId) continue;
    const atual = mapa.get(l.itemId);
    if (!atual || l.criadoEm > atual.criadoEm) mapa.set(l.itemId, l);
  }
  return mapa;
}

export type SituacaoEnvio<L> = { tipo: "aguardando" | "recusado"; lote: L };
export type SituacaoEnvioItem = SituacaoEnvio<LoteEnvio> | { tipo: "todos"; lote: LoteEnvio };

export function situacaoDoLote<L extends Pick<LoteDe<EnvioDoLote>, "status" | "ciente">>(
  lote: L | undefined,
): SituacaoEnvio<L> | null {
  if (!lote) return null;
  if (lote.status === "aguardando") return { tipo: "aguardando", lote };
  if (lote.status === "recusado" && !lote.ciente) return { tipo: "recusado", lote };
  return null;
}

/** Chip e drawer da tarefa original: "todos" não trava o item. */
export function situacaoDoItem(lote: LoteEnvio | undefined): SituacaoEnvioItem | null {
  if (!lote) return null;
  if (lote.modo === "todos") {
    if (lote.envios.every((e) => e.status === "cancelado")) return null;
    return { tipo: "todos", lote };
  }
  return situacaoDoLote(lote);
}

/** Aceite que quem enviou ainda não viu (sem "Ok"): fica em "Precisa da sua atenção". */
export function aceiteNaoVisto(lote: LoteEnvio) {
  return lote.modo !== "todos" && lote.status === "aceito" && !lote.ciente;
}

/** Recusa de todos ainda sem "Ok". */
export function recusaNaoVista(lote: LoteEnvio) {
  return lote.modo !== "todos" && lote.status === "recusado" && !lote.ciente;
}
