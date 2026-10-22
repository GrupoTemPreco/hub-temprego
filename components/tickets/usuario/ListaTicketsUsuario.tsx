"use client";

import type { ReactNode } from "react";
import { PrioridadeBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges";
import { tempoRelativo } from "@/lib/format";
import type { Ticket } from "@/lib/types/shell";

type Props = {
  tickets: Ticket[];
  /** Destino (para quem abriu) ou autor (para quem recebeu). */
  outraParte: (ticket: Ticket) => string;
  novidades: Set<string>;
  onAbrir: (ticket: Ticket) => void;
  /** Botão extra à direita do item (ex.: Assumir). */
  acao?: (ticket: Ticket) => ReactNode;
  vazio?: string;
  limite?: number;
};

const ultimaAtualizacao = (t: Ticket) => t.atualizado_em ?? t.criado_em;

export function ordenarPorAtualizacao(tickets: Ticket[]) {
  return [...tickets].sort((a, b) => new Date(ultimaAtualizacao(b)).getTime() - new Date(ultimaAtualizacao(a)).getTime());
}

export function ListaTicketsUsuario({ tickets, outraParte, novidades, onAbrir, acao, vazio, limite }: Props) {
  const itens = ordenarPorAtualizacao(tickets).slice(0, limite);
  if (itens.length === 0) {
    return vazio ? <p className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-sm text-white/45">{vazio}</p> : null;
  }

  return (
    <ul className="space-y-1.5">
      {itens.map((t) => {
        const novo = novidades.has(t.id);
        return (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/3 pr-2 transition-colors hover:bg-white/6"
          >
            <button type="button" onClick={() => onAbrir(t)} className="flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${novo ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-transparent"}`}
                aria-label={novo ? "Tem novidade" : undefined}
                title={novo ? "Tem novidade" : undefined}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-white/45">#{t.numero}</span>
                  <span className={`truncate text-sm ${novo ? "font-semibold text-white" : "font-medium text-white/85"}`}>
                    {t.titulo}
                  </span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <TicketStatusBadge status={t.status} />
                  <PrioridadeBadge prioridade={t.prioridade} />
                  <span className="truncate text-xs text-white/50">{outraParte(t)}</span>
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-white/40">{tempoRelativo(ultimaAtualizacao(t))}</span>
            </button>
            {acao?.(t)}
          </li>
        );
      })}
    </ul>
  );
}
