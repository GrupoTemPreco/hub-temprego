import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  corPrioridade,
  corStatusTicket,
  rotuloCategoria,
  rotuloPrioridade,
  rotuloStatusTicket,
} from "@/lib/tickets";

export function TicketStatusBadge({ status }: { status: string }) {
  return <Badge variant={corStatusTicket(status)}>{rotuloStatusTicket(status)}</Badge>;
}

export function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  return <Badge variant={corPrioridade(prioridade)}>{rotuloPrioridade(prioridade)}</Badge>;
}

export function CategoriaBadge({ categoria }: { categoria: string }) {
  return (
    <span className="rounded border border-white/10 bg-white/5 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-white/55">
      {rotuloCategoria(categoria)}
    </span>
  );
}

export function AtrasadoBadge() {
  return (
    <Badge variant="danger">
      <AlertTriangle className="h-3 w-3" /> Atrasado
    </Badge>
  );
}
