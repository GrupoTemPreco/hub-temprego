"use client";

import { useCallback, useState } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { assumirTicket } from "@/lib/admin/ticketsAcoes";
import type { Ticket } from "@/lib/types/shell";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";

/** "Assumir" direto da lista (tickets do setor sem responsável). */
export function useAssumirTicket() {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const { atualizar } = useTicketsUsuario();
  const [assumindo, setAssumindo] = useState<string | null>(null);

  const assumir = useCallback(
    async (t: Ticket) => {
      setAssumindo(t.id);
      try {
        await assumirTicket(t.id, usuario.id);
        toast.success(`Você assumiu o ticket #${t.numero}.`);
        atualizar();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setAssumindo(null);
      }
    },
    [toast, usuario.id, atualizar],
  );

  return { assumindo, assumir };
}

type Props = { ticket: Ticket; assumindo: string | null; onAssumir: (ticket: Ticket) => void };

export function BotaoAssumir({ ticket, assumindo, onAssumir }: Props) {
  return (
    <Button size="sm" variant="secondary" disabled={assumindo !== null} onClick={() => onAssumir(ticket)}>
      <UserCheck className="h-3.5 w-3.5" /> {assumindo === ticket.id ? "Assumindo..." : "Assumir"}
    </Button>
  );
}
