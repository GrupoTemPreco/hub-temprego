"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { BotaoAssumir, useAssumirTicket } from "@/components/tickets/usuario/AssumirTicket";
import { ListaTicketsUsuario, ordenarPorAtualizacao } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import type { Ticket } from "@/lib/types/shell";
import { ColunaTickets } from "./ColunaTickets";

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">{titulo}</h4>
      {children}
    </div>
  );
}

/**
 * Com novidade primeiro, depois os do setor sem responsável (com Assumir) e os demais por última atualização.
 * "Em que participei" fica recolhido no fim.
 */
export function ColunaRecebidos({ onAbrir }: { onAbrir: (ticket: Ticket) => void }) {
  const { classificados, novidades, referencias } = useTicketsUsuario();
  const { assumindo, assumir } = useAssumirTicket();
  if (!referencias) return null;

  const { semResponsavelDoSetor, recebidos, participei } = classificados;
  const semResponsavel = new Set(semResponsavelDoSetor.map((t) => t.id));
  const comNovidade = ordenarPorAtualizacao([...semResponsavelDoSetor, ...recebidos].filter((t) => novidades.has(t.id)));
  const setorSemNovidade = ordenarPorAtualizacao(semResponsavelDoSetor.filter((t) => !novidades.has(t.id)));
  const demais = ordenarPorAtualizacao(recebidos.filter((t) => !novidades.has(t.id)));

  const lista = (tickets: Ticket[]) => (
    <ListaTicketsUsuario
      tickets={tickets}
      ordenar={false}
      outraParte={(t) => `De ${referencias.nomes.usuario(t.autor_id)}`}
      novidades={novidades}
      onAbrir={onAbrir}
      acao={(t) => (semResponsavel.has(t.id) ? <BotaoAssumir ticket={t} assumindo={assumindo} onAssumir={assumir} /> : null)}
    />
  );

  return (
    <ColunaTickets
      titulo="Recebidos"
      total={semResponsavelDoSetor.length + recebidos.length}
      novidades={comNovidade.length}
      vazio="Nenhum ticket recebido."
    >
      {comNovidade.length > 0 && <Grupo titulo="Com novidade">{lista(comNovidade)}</Grupo>}
      {setorSemNovidade.length > 0 && <Grupo titulo="Do meu setor, sem responsável">{lista(setorSemNovidade)}</Grupo>}
      {demais.length > 0 && <Grupo titulo="Outros recebidos">{lista(demais)}</Grupo>}

      {participei.length > 0 && (
        <details className="group rounded-lg border border-white/10">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/50 hover:text-white/80">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
            Em que participei ({participei.length})
          </summary>
          <div className="border-t border-white/5 p-2">
            <ListaTicketsUsuario
              tickets={participei}
              outraParte={(t) => `De ${referencias.nomes.usuario(t.autor_id)}`}
              novidades={novidades}
              onAbrir={onAbrir}
            />
          </div>
        </details>
      )}
    </ColunaTickets>
  );
}
