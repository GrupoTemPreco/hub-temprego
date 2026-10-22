import { AlertTriangle } from "lucide-react";
import { tempoRelativo } from "@/lib/format";
import { estaAtrasado } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";

export function TempoAberto({ ticket }: { ticket: Pick<Ticket, "criado_em" | "status" | "excluido_em" | "prazo_em"> }) {
  const atrasado = estaAtrasado(ticket);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-xs ${atrasado ? "font-medium text-rose-400" : "text-white/55"}`}
      title={atrasado ? "Atrasado" : undefined}
    >
      {atrasado && <AlertTriangle className="h-3.5 w-3.5" />}
      {tempoRelativo(ticket.criado_em)}
    </span>
  );
}
