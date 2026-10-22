"use client";

import { Modal } from "@/components/ui/Modal";
import { TicketForm } from "@/components/tickets/TicketForm";
import type { Ticket } from "@/lib/types/shell";

type Props = {
  onClose: () => void;
  onCriado: (ticket: Pick<Ticket, "id" | "numero">) => void;
  onVariosCriados: () => void;
};

export function NovoTicketModal({ onClose, onCriado, onVariosCriados }: Props) {
  return (
    <Modal open onClose={onClose} title="Novo ticket" size="lg">
      <TicketForm onCriado={onCriado} onVariosCriados={onVariosCriados} onCancelar={onClose} />
    </Modal>
  );
}
