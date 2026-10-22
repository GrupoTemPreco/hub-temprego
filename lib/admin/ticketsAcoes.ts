import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { decodificarDestino, enviarMensagem, type DestinoValor } from "@/lib/ticketsApi";
import { removerArquivosDoTicket } from "@/lib/ticketsAnexos";
import type { Ticket, TicketCategoria, TicketPrioridade, TicketStatus } from "@/lib/types/shell";

// O banco grava os eventos de sistema a partir destes updates; o front não insere esses eventos.

async function atualizar(ticketId: string, campos: Partial<Ticket>) {
  const { error } = await supabase.from("tickets").update(campos).eq("id", ticketId);
  if (error) throw new Error(error.message);
}

export const assumirTicket = (ticketId: string, usuarioId: string) =>
  atualizar(ticketId, { responsavel_id: usuarioId });

export const mudarStatusTicket = (ticketId: string, status: TicketStatus) => atualizar(ticketId, { status });

export const mudarPrioridadeTicket = (ticketId: string, prioridade: TicketPrioridade) =>
  atualizar(ticketId, { prioridade });

export const mudarCategoriaTicket = (ticketId: string, categoria: TicketCategoria) =>
  atualizar(ticketId, { categoria });

export async function encaminharTicket(ticketId: string, destino: DestinoValor, mensagem: string, autorId: string) {
  await atualizar(ticketId, decodificarDestino(destino));
  if (mensagem.trim()) await enviarMensagem(ticketId, mensagem, false, autorId);
}

export const moverParaLixeira = (ticketId: string, usuarioId: string) =>
  atualizar(ticketId, { excluido_em: new Date().toISOString(), excluido_por: usuarioId });

export const restaurarTicket = (ticketId: string) => atualizar(ticketId, { excluido_em: null, excluido_por: null });

/** Apaga primeiro os arquivos do bucket; se falhar, o ticket fica. As linhas de ticket_anexos saem em cascata. */
export async function excluirTicketDefinitivamente(ticket: Pick<Ticket, "id" | "numero" | "titulo">) {
  await removerArquivosDoTicket(ticket.id);

  const { error } = await supabase.from("tickets").delete().eq("id", ticket.id);
  if (error) throw new Error(error.message);

  await registrarAcao({
    acao: "excluir_ticket_definitivo",
    alvo_tipo: "ticket",
    alvo_id: ticket.id,
    descricao: `excluiu definitivamente o ticket #${ticket.numero} – ${ticket.titulo}`,
    dados: { numero: ticket.numero, titulo: ticket.titulo },
  });
}
