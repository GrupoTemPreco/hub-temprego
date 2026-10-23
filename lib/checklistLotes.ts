import type { ChecklistEnvio } from "@/lib/types/shell";

/** Situação geral de um envio (todos os destinatários do lote juntos). */
export type StatusLote = "aguardando" | "aceito" | "recusado" | "cancelado";

export type LoteEnvio = {
  /** lote_id; envios antigos, sem lote, usam o próprio id. */
  id: string;
  itemId: string | null;
  titulo: string;
  setorId: string | null;
  mensagem: string | null;
  prazoSugerido: string | null;
  /** Um por destinatário, na ordem em que foram criados. */
  envios: ChecklistEnvio[];
  pendentes: ChecklistEnvio[];
  recusados: ChecklistEnvio[];
  aceito: ChecklistEnvio | null;
  status: StatusLote;
  criadoEm: string;
  /** Último envio ou reenvio do lote (base do intervalo de 30 minutos). */
  ultimoEnvioEm: string;
  reenvios: number;
  /** Quem enviou já deu "Ok" na resposta (aceite ou recusa de todos). */
  ciente: boolean;
};

export const idDoLote = (e: Pick<ChecklistEnvio, "id" | "lote_id">) => e.lote_id ?? e.id;

/**
 * Aceite manda em tudo; senão, aguardando enquanto houver pendente; cancelado se o envio foi cancelado;
 * recusado só quando todos recusaram (sem pendente e sem aceito).
 */
export function statusDoLote(envios: Pick<ChecklistEnvio, "status">[]): StatusLote {
  if (envios.some((e) => e.status === "aceito")) return "aceito";
  if (envios.some((e) => e.status === "pendente")) return "aguardando";
  if (envios.some((e) => e.status === "cancelado")) return "cancelado";
  return "recusado";
}

function montarLote(id: string, envios: ChecklistEnvio[]): LoteEnvio {
  const ordenados = [...envios].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const [primeiro] = ordenados;
  const status = statusDoLote(ordenados);
  const aceito = ordenados.find((e) => e.status === "aceito") ?? null;
  const recusados = ordenados.filter((e) => e.status === "recusado");
  return {
    id,
    itemId: primeiro.item_id,
    titulo: primeiro.titulo,
    setorId: primeiro.setor_id,
    mensagem: primeiro.mensagem,
    prazoSugerido: primeiro.prazo_sugerido,
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

/** Envios agrupados por lote, do mais novo para o mais antigo. */
export function agruparLotes(envios: ChecklistEnvio[]): LoteEnvio[] {
  const porLote = new Map<string, ChecklistEnvio[]>();
  for (const e of envios) porLote.set(idDoLote(e), [...(porLote.get(idDoLote(e)) ?? []), e]);
  return [...porLote.entries()].map(([id, lista]) => montarLote(id, lista)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
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

export type SituacaoEnvioItem = { tipo: "aguardando" | "recusado"; lote: LoteEnvio };

export function situacaoDoLote(lote: LoteEnvio | undefined): SituacaoEnvioItem | null {
  if (!lote) return null;
  if (lote.status === "aguardando") return { tipo: "aguardando", lote };
  if (lote.status === "recusado" && !lote.ciente) return { tipo: "recusado", lote };
  return null;
}

/** Aceite que quem enviou ainda não viu (sem "Ok"): fica em "Precisa da sua atenção". */
export function aceiteNaoVisto(lote: LoteEnvio) {
  return lote.status === "aceito" && !lote.ciente;
}

/** Recusa de todos ainda sem "Ok". */
export function recusaNaoVista(lote: LoteEnvio) {
  return lote.status === "recusado" && !lote.ciente;
}
