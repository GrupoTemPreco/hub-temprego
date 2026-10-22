"use client";

import { useCallback } from "react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useTelaAtual } from "@/lib/telaAtual";
import type { UsuarioReferencia } from "@/lib/ticketsApi";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";

type Props = {
  onCriado: (numero: number) => void;
  onVariosCriados: () => void;
};

/**
 * TicketForm do balão. Usuário comum: setores ativos e pessoas que recebem tickets (exceto ela mesma).
 * Admin: a mesma regra do "Novo ticket" do admin (padrão do TicketForm).
 */
export function NovoTicketUsuario({ onCriado, onVariosCriados }: Props) {
  const usuario = useUsuarioAtual();
  const tela = useTelaAtual();
  const toast = useToast();
  const { atualizar } = useTicketsUsuario();

  const recebeTickets = useCallback(
    (u: UsuarioReferencia) => u.status === "aprovado" && Boolean(u.recebe_tickets) && u.id !== usuario.id,
    [usuario.id],
  );

  return (
    <TicketForm
      filtrarPessoa={usuario.isAdmin ? undefined : recebeTickets}
      moduloOrigem={tela}
      semDestinos={
        <EmptyState
          icon={Inbox}
          title="Ainda não há para quem enviar tickets"
          description="Nenhum setor ou pessoa está recebendo tickets no momento. Fale com um administrador."
        />
      }
      onCriado={(ticket) => {
        toast.success(`Ticket #${ticket.numero} criado.`);
        atualizar();
        onCriado(ticket.numero);
      }}
      onVariosCriados={() => {
        atualizar();
        onVariosCriados();
      }}
    />
  );
}
