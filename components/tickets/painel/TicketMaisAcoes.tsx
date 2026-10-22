"use client";

import { useRef, useState } from "react";
import { ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET, STATUS_TICKET } from "@/lib/tickets";
import type { Ticket, TicketCategoria, TicketPrioridade, TicketStatus } from "@/lib/types/shell";

type Props = {
  ticket: Ticket;
  onStatus: (status: TicketStatus) => void;
  onPrioridade: (prioridade: TicketPrioridade) => void;
  onCategoria: (categoria: TicketCategoria) => void;
  onExcluir: () => void;
};

const SELECT = "w-full rounded-md border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500";

export function TicketMaisAcoes({ ticket, onStatus, onPrioridade, onCategoria, onExcluir }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={() => setAberto((v) => !v)}>
        Mais ações <ChevronUp className={`h-4 w-4 transition-transform ${aberto ? "" : "rotate-180"}`} />
      </Button>

      {aberto && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-64 space-y-3 rounded-lg border border-white/15 bg-[#0f172a] p-3 shadow-xl">
          <label className="block">
            <span className="mb-1 block text-xs text-white/55">Status</span>
            <select
              className={SELECT}
              value={ticket.status}
              onChange={(e) => {
                onStatus(e.target.value as TicketStatus);
                fechar();
              }}
            >
              {STATUS_TICKET.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/55">Prioridade</span>
            <select
              className={SELECT}
              value={ticket.prioridade}
              onChange={(e) => {
                onPrioridade(e.target.value as TicketPrioridade);
                fechar();
              }}
            >
              {PRIORIDADES_TICKET.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/55">Categoria</span>
            <select
              className={SELECT}
              value={ticket.categoria}
              onChange={(e) => {
                onCategoria(e.target.value as TicketCategoria);
                fechar();
              }}
            >
              {CATEGORIAS_TICKET.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              fechar();
              onExcluir();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" /> Mover para a lixeira
          </button>
        </div>
      )}
    </div>
  );
}
