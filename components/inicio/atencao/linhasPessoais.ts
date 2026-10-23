import { CalendarClock, CheckCircle2, Clock, Inbox, ListChecks, MessageSquare, Pin, XCircle } from "lucide-react";
import { formatarPrazo } from "@/lib/checklistRegras";
import type { ItemAtencao, MotivoItemChecklist } from "@/lib/precisaAtencao";
import type { LoteEnvio } from "@/lib/checklistLotes";
import { textoPrazoCombinado } from "@/components/checklist/envios/avisosDoEnvio";
import { motivosRecusa, rotuloRecusa } from "@/components/checklist/envios/textosLote";
import type { LinhaAtencaoDados } from "./LinhaAtencao";

export type ContextoLinhas = {
  nomeDe: (usuarioId: string | null) => string;
  abrirChecklist: (itemId?: string) => void;
  abrirEnviadas: () => void;
  abrirTicket: (numero: number) => void;
  desfixar: (itemId: string) => void;
  ciente: (lote: LoteEnvio) => void;
  /** Falso para item aguardando resposta de envio ou de lista compartilhada só para leitura. */
  podeAlterar: (itemId: string) => boolean;
};

const MOTIVOS: Record<MotivoItemChecklist, Pick<LinhaAtencaoDados, "icone" | "cor" | "chip">> = {
  vencido: { icone: CalendarClock, cor: "bg-rose-500/15 text-rose-400", chip: { texto: "Vencido", cor: "danger" } },
  critico: { icone: ListChecks, cor: "bg-rose-500/15 text-rose-400", chip: { texto: "Crítico", cor: "danger" } },
  proximo: { icone: CalendarClock, cor: "bg-amber-500/15 text-amber-400", chip: { texto: "Vence em breve", cor: "warning" } },
  fixado: { icone: Pin, cor: "bg-amber-500/15 text-amber-300", chip: { texto: "Fixado", cor: "neutral" } },
};

export function linhaPessoal(i: ItemAtencao, ctx: ContextoLinhas): LinhaAtencaoDados {
  switch (i.tipo) {
    case "recebida":
      return {
        id: i.id,
        icone: Inbox,
        cor: "bg-blue-500/15 text-blue-400",
        texto: i.envio.titulo,
        detalhe: `Tarefa recebida de ${ctx.nomeDe(i.envio.de_usuario_id)}`,
        chip: { texto: "Recebida", cor: "info" },
        onAbrir: () => ctx.abrirChecklist(),
      };
    case "recusada": {
      const { lote } = i;
      const motivos = motivosRecusa(lote, ctx).join(" · ");
      return {
        id: i.id,
        icone: XCircle,
        cor: "bg-rose-500/15 text-rose-400",
        texto: lote.titulo,
        detalhe: `${rotuloRecusa(lote, ctx)}${motivos ? ` · ${motivos}` : ""}`,
        chip: { texto: "Recusada", cor: "danger" },
        onAbrir: () => ctx.abrirChecklist(lote.itemId ?? undefined),
      };
    }
    case "aceita": {
      const { lote } = i;
      const aceito = lote.aceito!;
      const resposta = aceito.resposta ? ` · "${aceito.resposta}"` : "";
      return {
        id: i.id,
        icone: CheckCircle2,
        cor: "bg-emerald-500/15 text-emerald-400",
        texto: lote.titulo,
        detalhe: `Aceita por ${ctx.nomeDe(aceito.para_usuario_id)}${resposta} · ${textoPrazoCombinado(aceito)}`,
        chip: { texto: "Aceita", cor: "success" },
        onAbrir: () => ctx.abrirEnviadas(),
        acao: { tipo: "ok", onClick: () => ctx.ciente(lote) },
      };
    }
    case "checklist": {
      const { item, motivo } = i;
      const podeAlterar = ctx.podeAlterar(item.id);
      return {
        id: i.id,
        ...MOTIVOS[motivo],
        texto: item.titulo,
        detalhe: item.prazo ? `Prazo ${formatarPrazo(item.prazo)}` : "Sem prazo",
        onAbrir: () => ctx.abrirChecklist(item.id),
        acao:
          motivo === "fixado"
            ? {
                tipo: "desfixar",
                onClick: () => ctx.desfixar(item.id),
                desabilitado: !podeAlterar,
                dica: podeAlterar ? undefined : "Este item não pode ser alterado por você agora",
              }
            : undefined,
      };
    }
    case "ticket-atrasado":
      return {
        id: i.id,
        icone: Clock,
        cor: "bg-rose-500/15 text-rose-400",
        texto: `#${i.ticket.numero} ${i.ticket.titulo}`,
        detalhe: "Ticket com você, prazo vencido",
        chip: { texto: "Atrasado", cor: "danger" },
        onAbrir: () => ctx.abrirTicket(i.ticket.numero),
      };
    case "ticket-aguardando":
      return {
        id: i.id,
        icone: MessageSquare,
        cor: "bg-amber-500/15 text-amber-400",
        texto: `#${i.ticket.numero} ${i.ticket.titulo}`,
        detalhe: "O atendimento aguarda a sua resposta",
        chip: { texto: "Aguardando você", cor: "warning" },
        onAbrir: () => ctx.abrirTicket(i.ticket.numero),
      };
  }
}
