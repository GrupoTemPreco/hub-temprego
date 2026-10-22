import type { BadgeVariant } from "@/components/ui/Badge";
import type {
  Ticket,
  TicketCategoria,
  TicketEvento,
  TicketPrioridade,
  TicketStatus,
} from "@/lib/types/shell";

export const STATUS_TICKET: Array<{ value: TicketStatus; label: string; cor: BadgeVariant }> = [
  { value: "aberto", label: "Aberto", cor: "info" },
  { value: "em_andamento", label: "Em andamento", cor: "warning" },
  { value: "aguardando_solicitante", label: "Aguardando solicitante", cor: "purple" },
  { value: "resolvido", label: "Resolvido", cor: "success" },
  { value: "recusado", label: "Recusado", cor: "danger" },
  { value: "fechado", label: "Fechado", cor: "neutral" },
];

export const CATEGORIAS_TICKET: Array<{ value: TicketCategoria; label: string }> = [
  { value: "ajuste", label: "Ajuste" },
  { value: "bug", label: "Bug" },
  { value: "ideia", label: "Ideia" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "acesso", label: "Acesso" },
];

export const PRIORIDADES_TICKET: Array<{ value: TicketPrioridade; label: string; cor: BadgeVariant }> = [
  { value: "urgente", label: "Urgente", cor: "danger" },
  { value: "alta", label: "Alta", cor: "orange" },
  { value: "normal", label: "Normal", cor: "info" },
  { value: "baixa", label: "Baixa", cor: "neutral" },
];

export const STATUS_ENCERRADOS: TicketStatus[] = ["resolvido", "recusado", "fechado"];

/** Lista no formato do filtro `in` do PostgREST. */
export const FILTRO_STATUS_ENCERRADOS = `(${STATUS_ENCERRADOS.join(",")})`;

export const DIAS_PARADO = 5;

export function rotuloStatusTicket(status: string | null) {
  return STATUS_TICKET.find((s) => s.value === status)?.label ?? status ?? "—";
}

export function corStatusTicket(status: string | null): BadgeVariant {
  return STATUS_TICKET.find((s) => s.value === status)?.cor ?? "neutral";
}

export function rotuloCategoria(categoria: string | null) {
  return CATEGORIAS_TICKET.find((c) => c.value === categoria)?.label ?? categoria ?? "—";
}

export function rotuloPrioridade(prioridade: string | null) {
  return PRIORIDADES_TICKET.find((p) => p.value === prioridade)?.label ?? prioridade ?? "—";
}

export function corPrioridade(prioridade: string | null): BadgeVariant {
  return PRIORIDADES_TICKET.find((p) => p.value === prioridade)?.cor ?? "neutral";
}

export function estaEncerrado(status: string | null) {
  return STATUS_ENCERRADOS.includes(status as TicketStatus);
}

export function estaAtrasado(ticket: Pick<Ticket, "status" | "excluido_em" | "prazo_em">, agora = new Date()) {
  return (
    !estaEncerrado(ticket.status) &&
    !ticket.excluido_em &&
    Boolean(ticket.prazo_em) &&
    new Date(ticket.prazo_em!).getTime() < agora.getTime()
  );
}

export function limiteParado(agora = new Date()) {
  return new Date(agora.getTime() - DIAS_PARADO * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Quem vê e quem faz o quê (lado do usuário). O admin usa PERMISSOES_ADMIN.
// ---------------------------------------------------------------------------

type TicketPapel = Pick<
  Ticket,
  "autor_id" | "destino_usuario_id" | "destino_setor_id" | "responsavel_id" | "status" | "excluido_em"
>;

export type ContextoUsuarioTicket = {
  usuarioId: string;
  /** Setores de que o usuário é membro (usuario_setores). */
  setores: string[];
  /** Aparece como autor_id, de_usuario_id ou para_usuario_id em algum evento do ticket. */
  participou: boolean;
};

export function papelNoTicket(ticket: TicketPapel, ctx: ContextoUsuarioTicket) {
  const autor = ticket.autor_id === ctx.usuarioId;
  const destinatario =
    ticket.destino_usuario_id === ctx.usuarioId ||
    ticket.responsavel_id === ctx.usuarioId ||
    (Boolean(ticket.destino_setor_id) && ctx.setores.includes(ticket.destino_setor_id!));
  return { autor, destinatario, participante: ctx.participou };
}

/** Tickets na lixeira nunca aparecem para usuários comuns. */
export function usuarioVeTicket(ticket: TicketPapel, ctx: ContextoUsuarioTicket) {
  if (ticket.excluido_em) return false;
  const p = papelNoTicket(ticket, ctx);
  return p.autor || p.destinatario || p.participante;
}

export type PermissoesTicket = {
  responder: boolean;
  notaInterna: boolean;
  verInternos: boolean;
  assumir: boolean;
  encaminhar: boolean;
  /** Status que podem ser escolhidos livremente (além de concluir/reabrir). */
  statusPermitidos: TicketStatus[];
  resolver: boolean;
  reabrir: boolean;
  /** Prioridade, categoria, lixeira e restauração: só no admin. */
  gerenciar: boolean;
};

export const STATUS_DESTINATARIO: TicketStatus[] = ["em_andamento", "aguardando_solicitante", "resolvido", "recusado"];

export const PERMISSOES_ADMIN: PermissoesTicket = {
  responder: true,
  notaInterna: true,
  verInternos: true,
  assumir: true,
  encaminhar: true,
  statusPermitidos: STATUS_TICKET.map((s) => s.value),
  resolver: true,
  reabrir: true,
  gerenciar: true,
};

/**
 * Autor: responde, anexa, marca como resolvido e reabre quando encerrado.
 * Destinatário (pessoa, responsável ou membro do setor): responde, anexa, assume, muda status e encaminha.
 * Participante anterior: vê e responde.
 */
export function permissoesDoUsuario(ticket: TicketPapel, ctx: ContextoUsuarioTicket): PermissoesTicket {
  const p = papelNoTicket(ticket, ctx);
  const encerrado = estaEncerrado(ticket.status);
  return {
    responder: p.autor || p.destinatario || p.participante,
    notaInterna: false,
    verInternos: false,
    assumir: p.destinatario && ticket.responsavel_id !== ctx.usuarioId,
    encaminhar: p.destinatario,
    statusPermitidos: p.destinatario ? STATUS_DESTINATARIO : [],
    resolver: p.autor && !encerrado,
    reabrir: p.autor && encerrado,
    gerenciar: false,
  };
}

/** Não encerrado e com a pessoa: ela é responsável ou destino, ou é de um setor dela sem responsável. */
export function ticketComigo(ticket: TicketPapel, usuarioId: string, setores: string[]) {
  if (estaEncerrado(ticket.status) || ticket.excluido_em) return false;
  return (
    ticket.responsavel_id === usuarioId ||
    ticket.destino_usuario_id === usuarioId ||
    (!ticket.responsavel_id && Boolean(ticket.destino_setor_id) && setores.includes(ticket.destino_setor_id!))
  );
}

export type TicketsClassificados<T extends TicketPapel> = {
  /** Abertos pela pessoa. */
  meus: T[];
  /** Destino ou responsável é a pessoa, ou o destino é um setor dela (exceto os sem responsável abaixo). */
  recebidos: T[];
  /** Do setor da pessoa, sem responsável e não encerrados. */
  semResponsavelDoSetor: T[];
  /** Só participou (ex.: encaminhou), sem ser autor nem destinatário. */
  participei: T[];
};

export function classificarTicketsDoUsuario<T extends TicketPapel & { id: string }>(
  tickets: T[],
  ctxDe: (ticket: T) => ContextoUsuarioTicket,
): TicketsClassificados<T> {
  const r: TicketsClassificados<T> = { meus: [], recebidos: [], semResponsavelDoSetor: [], participei: [] };
  for (const t of tickets) {
    const ctx = ctxDe(t);
    const p = papelNoTicket(t, ctx);
    if (p.autor) r.meus.push(t);
    const doSetorSemResponsavel =
      !t.responsavel_id && Boolean(t.destino_setor_id) && ctx.setores.includes(t.destino_setor_id!) && !estaEncerrado(t.status);
    if (doSetorSemResponsavel) r.semResponsavelDoSetor.push(t);
    else if (p.destinatario) r.recebidos.push(t);
    else if (!p.autor && p.participante) r.participei.push(t);
  }
  return r;
}

/** Traduz ids de usuários e setores em nomes. */
export type ResolvedorNomes = {
  usuario: (id: string | null) => string;
  setor: (id: string | null) => string;
};

export function nomeDestino(
  ticket: Pick<Ticket, "destino_usuario_id" | "destino_setor_id">,
  nomes: ResolvedorNomes,
) {
  if (ticket.destino_setor_id) return nomes.setor(ticket.destino_setor_id);
  if (ticket.destino_usuario_id) return nomes.usuario(ticket.destino_usuario_id);
  return "—";
}

type ContextoFrase = {
  nomes: ResolvedorNomes;
  /** Quando informado, a frase cita o ticket (usado fora do painel do ticket). */
  numero?: number;
  ticket?: Pick<Ticket, "destino_usuario_id" | "destino_setor_id">;
};

/** Frase de um evento sem o nome do autor, ex.: "mudou o status de Aberto para Resolvido". */
export function fraseEvento(evento: TicketEvento, { nomes, numero, ticket }: ContextoFrase): string {
  const o = numero !== undefined ? ` o ticket #${numero}` : " o ticket";
  const doTicket = numero !== undefined ? ` do ticket #${numero}` : "";
  const no = numero !== undefined ? ` no ticket #${numero}` : "";
  const lado = (usuarioId: string | null, setorId: string | null) =>
    setorId ? nomes.setor(setorId) : usuarioId ? nomes.usuario(usuarioId) : "—";

  switch (evento.tipo) {
    case "criado": {
      const destino =
        evento.para_setor_id || evento.para_usuario_id
          ? lado(evento.para_usuario_id, evento.para_setor_id)
          : ticket
            ? nomeDestino(ticket, nomes)
            : null;
      return destino ? `abriu${o} para ${destino}` : `abriu${o}`;
    }
    case "mensagem":
      return evento.interno ? `adicionou uma nota interna${no}` : numero !== undefined ? `respondeu${o}` : "respondeu";
    case "status":
      return `mudou o status${doTicket} de ${rotuloStatusTicket(evento.status_anterior)} para ${rotuloStatusTicket(
        evento.status_novo,
      )}`;
    case "reaberto":
      return `reabriu${o}`;
    case "encaminhado":
      return `encaminhou${o} de ${lado(evento.de_usuario_id, evento.de_setor_id)} para ${lado(
        evento.para_usuario_id,
        evento.para_setor_id,
      )}`;
    case "assumido":
      return evento.para_usuario_id && evento.para_usuario_id !== evento.autor_id
        ? `atribuiu${o} a ${nomes.usuario(evento.para_usuario_id)}`
        : `assumiu${o}`;
    case "prioridade":
      return `mudou a prioridade${doTicket}${evento.mensagem ? ` (${evento.mensagem})` : ""}`;
    case "excluido":
      return `moveu${o} para a lixeira`;
    case "restaurado":
      return `restaurou${o} da lixeira`;
    default:
      return `atualizou${o}`;
  }
}
