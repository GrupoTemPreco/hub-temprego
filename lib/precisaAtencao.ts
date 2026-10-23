import { hojeSP, situacaoPrazo } from "@/lib/checklistRegras";
import { aceiteNaoVisto, recusaNaoVista, ultimoLotePorItem, type LoteEnvio } from "@/lib/checklistLotes";
import { estaAtrasado, ticketComigo } from "@/lib/tickets";
import type { ChecklistEnvio, ChecklistItem, Ticket } from "@/lib/types/shell";

const URGENCIA_CRITICA = 4;

export type MotivoItemChecklist = "vencido" | "critico" | "proximo" | "fixado";

/** Motivo mais forte para um item pendente aparecer: vencido, crítico, vence em breve, fixado. */
export function motivoAtencaoItem(item: ChecklistItem, hoje = hojeSP()): MotivoItemChecklist | null {
  if (item.status === "feito") return null;
  const prazo = item.prazo ? situacaoPrazo(item.prazo, hoje) : null;
  if (prazo === "vencido") return "vencido";
  if (item.urgencia === URGENCIA_CRITICA) return "critico";
  if (prazo === "proximo") return "proximo";
  if (item.fixado) return "fixado";
  return null;
}

export type ItemAtencao =
  | { tipo: "recebida"; id: string; envio: ChecklistEnvio }
  | { tipo: "recusada"; id: string; lote: LoteEnvio }
  | { tipo: "aceita"; id: string; lote: LoteEnvio }
  | { tipo: "checklist"; id: string; motivo: MotivoItemChecklist; item: ChecklistItem }
  | { tipo: "ticket-atrasado"; id: string; ticket: Ticket }
  | { tipo: "ticket-aguardando"; id: string; ticket: Ticket };

/**
 * Recebidas, vencidos e atrasados, críticos, aguardando sua resposta, respostas aos seus envios
 * (recusadas e aceitas ainda não vistas), vence em breve, fixados.
 */
function peso(i: ItemAtencao) {
  switch (i.tipo) {
    case "recebida":
      return 0;
    case "ticket-atrasado":
      return 1;
    case "ticket-aguardando":
      return 3;
    case "recusada":
    case "aceita":
      return 4;
    case "checklist":
      return { vencido: 1, critico: 2, proximo: 5, fixado: 6 }[i.motivo];
  }
}

type Fontes = {
  usuarioId: string;
  setores: string[];
  acessoChecklist: boolean;
  recebidos: ChecklistEnvio[];
  /** Envios do usuário agrupados por lote: uma linha por envio, não por destinatário. */
  lotes: LoteEnvio[];
  itensChecklist: ChecklistItem[];
  tickets: Ticket[];
};

function itensDoChecklist(f: Fontes): ItemAtencao[] {
  if (!f.acessoChecklist) return [];
  const ultimos = ultimoLotePorItem(f.lotes);
  // Recusa de todos "ainda não vista": sem Ok e sem envio mais novo do mesmo item.
  const recusadas = f.lotes.filter((l) => recusaNaoVista(l) && (!l.itemId || ultimos.get(l.itemId)?.id === l.id));
  const hoje = hojeSP();
  const pendentes = [...f.itensChecklist].sort((a, b) => (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));

  return [
    ...f.recebidos.map((envio) => ({ tipo: "recebida" as const, id: `recebida-${envio.id}`, envio })),
    ...recusadas.map((lote) => ({ tipo: "recusada" as const, id: `recusada-${lote.id}`, lote })),
    ...f.lotes.filter(aceiteNaoVisto).map((lote) => ({ tipo: "aceita" as const, id: `aceita-${lote.id}`, lote })),
    ...pendentes.flatMap((item) => {
      const motivo = motivoAtencaoItem(item, hoje);
      return motivo ? [{ tipo: "checklist" as const, id: `item-${item.id}`, motivo, item }] : [];
    }),
  ];
}

function itensDeTickets(f: Fontes): ItemAtencao[] {
  const porPrazo = [...f.tickets].sort((a, b) => (a.prazo_em ?? "").localeCompare(b.prazo_em ?? ""));
  return porPrazo.flatMap((ticket): ItemAtencao[] => {
    if (estaAtrasado(ticket) && ticketComigo(ticket, f.usuarioId, f.setores)) {
      return [{ tipo: "ticket-atrasado", id: `ticket-${ticket.id}`, ticket }];
    }
    if (ticket.autor_id === f.usuarioId && ticket.status === "aguardando_solicitante") {
      return [{ tipo: "ticket-aguardando", id: `ticket-${ticket.id}`, ticket }];
    }
    return [];
  });
}

/** Itens pessoais do card "Precisa da sua atenção", já na ordem de exibição. */
export function montarAtencaoPessoal(f: Fontes): ItemAtencao[] {
  // sort é estável: dentro de cada peso fica a ordem de origem (prazo mais próximo primeiro).
  return [...itensDoChecklist(f), ...itensDeTickets(f)].sort((a, b) => peso(a) - peso(b));
}
