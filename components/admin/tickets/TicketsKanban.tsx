"use client";

import { CategoriaBadge, PrioridadeBadge } from "@/components/tickets/TicketBadges";
import { TempoAberto } from "@/components/tickets/TempoAberto";
import { ContadorAnexos } from "@/components/tickets/anexos/ContadorAnexos";
import type { TicketListagem } from "@/lib/admin/ticketsConsulta";
import { STATUS_TICKET, estaAtrasado, nomeDestino, type ResolvedorNomes } from "@/lib/tickets";
import type { Ticket, TicketStatus } from "@/lib/types/shell";

const COLUNAS_PADRAO: TicketStatus[] = ["aberto", "em_andamento", "aguardando_solicitante", "resolvido"];
const COLUNAS_ENCERRADAS: TicketStatus[] = ["recusado", "fechado"];

type Props = {
  tickets: TicketListagem[];
  nomes: ResolvedorNomes;
  mostrarEncerrados: boolean;
  onAbrir: (ticket: Ticket) => void;
};

function CardTicket({ ticket, nomes, onAbrir }: { ticket: TicketListagem; nomes: ResolvedorNomes; onAbrir: () => void }) {
  return (
    <button
      onClick={onAbrir}
      className={`w-full rounded-lg border bg-superficie-forte p-3 text-left transition-colors hover:bg-superficie ${
        estaAtrasado(ticket) ? "border-rose-500/40" : "border-borda"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-texto/50">#{ticket.numero}</span>
        <PrioridadeBadge prioridade={ticket.prioridade} />
      </div>
      <p className="mb-2 line-clamp-2 text-sm font-medium">{ticket.titulo}</p>
      <div className="mb-2 flex items-center justify-between gap-2">
        <CategoriaBadge categoria={ticket.categoria} />
        <ContadorAnexos total={ticket.total_anexos} />
      </div>
      <p className="truncate text-xs text-texto/50">
        {nomes.usuario(ticket.autor_id)} → {nomeDestino(ticket, nomes)}
      </p>
      <div className="mt-1.5">
        <TempoAberto ticket={ticket} />
      </div>
    </button>
  );
}

export function TicketsKanban({ tickets, nomes, mostrarEncerrados, onAbrir }: Props) {
  const colunas = mostrarEncerrados ? [...COLUNAS_PADRAO, ...COLUNAS_ENCERRADAS] : COLUNAS_PADRAO;

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {colunas.map((status) => {
        const doStatus = tickets.filter((t) => t.status === status);
        const rotulo = STATUS_TICKET.find((s) => s.value === status)?.label;
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col rounded-xl border border-borda bg-superficie">
            <div className="flex items-center justify-between border-b border-borda px-3 py-2">
              <span className="text-sm font-semibold">{rotulo}</span>
              <span className="rounded-full bg-superficie-hover px-2 text-xs text-texto/70">{doStatus.length}</span>
            </div>
            <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto p-2">
              {doStatus.length === 0 && <p className="py-6 text-center text-xs text-texto-fraco">Nenhum ticket</p>}
              {doStatus.map((t) => (
                <CardTicket key={t.id} ticket={t} nomes={nomes} onAbrir={() => onAbrir(t)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
