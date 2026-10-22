"use client";

import { CheckCircle2, Forward, RotateCcw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STATUS_TICKET, estaEncerrado, type PermissoesTicket } from "@/lib/tickets";
import type { Ticket, TicketCategoria, TicketPrioridade, TicketStatus } from "@/lib/types/shell";
import { TicketMaisAcoes } from "./TicketMaisAcoes";

type Props = {
  ticket: Ticket;
  usuarioId: string;
  permissoes: PermissoesTicket;
  ocupado: boolean;
  onAssumir: () => void;
  onStatus: (status: TicketStatus) => void;
  onPrioridade: (prioridade: TicketPrioridade) => void;
  onCategoria: (categoria: TicketCategoria) => void;
  onEncaminhar: () => void;
  onExcluir: () => void;
  onRestaurar: () => void;
};

const SELECT = "rounded-md border border-white/15 bg-white/5 px-2.5 py-2 text-sm text-white/85 outline-none focus:border-blue-500";

export function TicketAcoes(props: Props) {
  const { ticket, usuarioId, permissoes: p, ocupado } = props;

  if (ticket.excluido_em) {
    if (!p.gerenciar) return null;
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="text-sm text-rose-300">Este ticket está na lixeira.</span>
        <Button variant="secondary" disabled={ocupado} onClick={props.onRestaurar}>
          <RotateCcw className="h-4 w-4" /> Restaurar
        </Button>
      </div>
    );
  }

  const encerrado = estaEncerrado(ticket.status);
  const podeConcluir = !encerrado && (p.resolver || p.statusPermitidos.includes("resolvido"));
  // Fora do admin, os demais status permitidos aparecem num seletor simples.
  const outrosStatus = p.gerenciar
    ? []
    : p.statusPermitidos.filter((s) => s !== ticket.status && !(podeConcluir && s === "resolvido"));
  const botoes = [
    encerrado && p.reabrir,
    !encerrado && p.assumir && ticket.responsavel_id !== usuarioId,
    podeConcluir,
    !encerrado && p.encaminhar,
    outrosStatus.length > 0,
    p.gerenciar,
  ];
  if (!botoes.some(Boolean)) return null;

  return (
    <fieldset disabled={ocupado} className="flex flex-wrap items-center gap-2 px-5 py-3">
      {encerrado && p.reabrir && (
        <Button onClick={() => props.onStatus("aberto")}>
          <RotateCcw className="h-4 w-4" /> Reabrir
        </Button>
      )}
      {!encerrado && p.assumir && ticket.responsavel_id !== usuarioId && (
        <Button variant="secondary" onClick={props.onAssumir}>
          <UserCheck className="h-4 w-4" /> Assumir
        </Button>
      )}
      {podeConcluir && (
        <Button variant="success" onClick={() => props.onStatus("resolvido")}>
          <CheckCircle2 className="h-4 w-4" /> {p.gerenciar ? "Concluir" : "Marcar como resolvido"}
        </Button>
      )}
      {!encerrado && p.encaminhar && (
        <Button variant="secondary" onClick={props.onEncaminhar}>
          <Forward className="h-4 w-4" /> Encaminhar
        </Button>
      )}
      {outrosStatus.length > 0 && (
        <select
          aria-label="Mudar status"
          className={SELECT}
          value=""
          onChange={(e) => props.onStatus(e.target.value as TicketStatus)}
        >
          <option value="" disabled>
            Mudar status...
          </option>
          {outrosStatus.map((s) => (
            <option key={s} value={s}>
              {STATUS_TICKET.find((x) => x.value === s)?.label ?? s}
            </option>
          ))}
        </select>
      )}
      {p.gerenciar && (
        <div className="ml-auto">
          <TicketMaisAcoes
            ticket={ticket}
            onStatus={props.onStatus}
            onPrioridade={props.onPrioridade}
            onCategoria={props.onCategoria}
            onExcluir={props.onExcluir}
          />
        </div>
      )}
    </fieldset>
  );
}
