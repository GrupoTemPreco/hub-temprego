import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  AtrasadoBadge,
  CategoriaBadge,
  PrioridadeBadge,
  TicketStatusBadge,
} from "@/components/tickets/TicketBadges";
import { estaAtrasado, nomeDestino, type ResolvedorNomes } from "@/lib/tickets";
import { rotuloTela } from "@/lib/telaAtual";
import type { Ticket } from "@/lib/types/shell";

function formatarDataHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-white/45">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-white/85">{children}</dd>
    </div>
  );
}

type Props = {
  ticket: Ticket;
  nomes: ResolvedorNomes;
  /** Anexos da abertura, exibidos logo abaixo da descrição. */
  anexos?: ReactNode;
};

export function TicketCabecalho({ ticket, nomes, anexos }: Props) {
  const atrasado = estaAtrasado(ticket);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold leading-snug text-white">{ticket.titulo}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={ticket.status} />
          <PrioridadeBadge prioridade={ticket.prioridade} />
          {atrasado && <AtrasadoBadge />}
          {ticket.excluido_em && <Badge variant="danger">Na lixeira</Badge>}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-white/10 bg-white/2 p-3 sm:grid-cols-3">
        <Dado rotulo="Autor">{nomes.usuario(ticket.autor_id)}</Dado>
        <Dado rotulo="Criado em">{formatarDataHora(ticket.criado_em)}</Dado>
        <Dado rotulo="Destino">{nomeDestino(ticket, nomes)}</Dado>
        <Dado rotulo="Responsável">
          {ticket.responsavel_id ? nomes.usuario(ticket.responsavel_id) : <span className="text-amber-300">Sem responsável</span>}
        </Dado>
        <Dado rotulo="Prazo">
          <span className={atrasado ? "font-medium text-rose-400" : undefined}>{formatarDataHora(ticket.prazo_em)}</span>
        </Dado>
        <Dado rotulo="Categoria">
          <CategoriaBadge categoria={ticket.categoria} />
        </Dado>
        {ticket.modulo_origem && <Dado rotulo="Aberto a partir de">{rotuloTela(ticket.modulo_origem)}</Dado>}
      </dl>

      <div>
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">Descrição</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
          {ticket.descricao || <span className="text-white/40">Sem descrição.</span>}
        </p>
        {anexos}
      </div>
    </div>
  );
}
