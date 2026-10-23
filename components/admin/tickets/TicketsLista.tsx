"use client";

import { Badge } from "@/components/ui/Badge";
import { CheckboxSelecao } from "@/components/ui/CheckboxSelecao";
import type { Selecao } from "@/hooks/useSelecao";
import { CategoriaBadge, PrioridadeBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges";
import { TempoAberto } from "@/components/tickets/TempoAberto";
import { ContadorAnexos } from "@/components/tickets/anexos/ContadorAnexos";
import type { TicketListagem } from "@/lib/admin/ticketsConsulta";
import { tempoRelativo } from "@/lib/format";
import { estaAtrasado, nomeDestino, type ResolvedorNomes } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";

type Props = {
  tickets: TicketListagem[];
  nomes: ResolvedorNomes;
  selecao: Selecao;
  onAbrir: (ticket: Ticket) => void;
};

const TH = "px-3 py-3 font-medium";
const TD = "px-3 py-3";

export function TicketsLista({ tickets, nomes, selecao, onAbrir }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="w-10 py-3 pl-4">
              <CheckboxSelecao
                checked={selecao.todosVisiveis}
                indeterminado={selecao.algunsVisiveis}
                onChange={selecao.alternarTodosVisiveis}
                rotulo="Selecionar todos os tickets visíveis"
              />
            </th>
            <th className={TH}>#</th>
            <th className={TH}>Título</th>
            <th className={TH}>Autor</th>
            <th className={TH}>Destino</th>
            <th className={TH}>Responsável</th>
            <th className={TH}>Prioridade</th>
            <th className={TH}>Status</th>
            <th className={TH}>Em aberto</th>
            <th className={TH}>Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onAbrir(t)}
              className={`cursor-pointer border-b border-white/5 transition-colors ${
                estaAtrasado(t) ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-white/4"
              }`}
            >
              <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                <CheckboxSelecao
                  checked={selecao.estaSelecionado(t.id)}
                  onChange={() => selecao.alternar(t.id)}
                  rotulo={`Selecionar ticket #${t.numero}`}
                />
              </td>
              <td className={`${TD} font-mono text-white/55`}>#{t.numero}</td>
              <td className={TD}>
                <span className="flex items-center gap-2">
                  <span className="max-w-70 truncate font-medium">{t.titulo}</span>
                  <CategoriaBadge categoria={t.categoria} />
                  <ContadorAnexos total={t.total_anexos} />
                </span>
              </td>
              <td className={`${TD} text-white/70`}>{nomes.usuario(t.autor_id)}</td>
              <td className={`${TD} text-white/70`}>{nomeDestino(t, nomes)}</td>
              <td className={TD}>
                {t.responsavel_id ? (
                  <span className="text-white/70">{nomes.usuario(t.responsavel_id)}</span>
                ) : (
                  <Badge variant="warning">Sem responsável</Badge>
                )}
              </td>
              <td className={TD}>
                <PrioridadeBadge prioridade={t.prioridade} />
              </td>
              <td className={TD}>
                <TicketStatusBadge status={t.status} />
              </td>
              <td className={TD}>
                <TempoAberto ticket={t} />
              </td>
              <td className={`${TD} whitespace-nowrap text-xs text-white/50`}>
                {t.atualizado_em ? tempoRelativo(t.atualizado_em) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
