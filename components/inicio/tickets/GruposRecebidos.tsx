"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { BotaoAssumir, useAssumirTicket } from "@/components/tickets/usuario/AssumirTicket";
import { ContadorNovidades } from "@/components/tickets/usuario/ContadorNovidades";
import { ListaTicketsUsuario, ordenarPorAtualizacao } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import type { Ticket } from "@/lib/types/shell";

export function TituloGrupoTickets({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
      {children}
    </h3>
  );
}

/** Lista vazia de um grupo: texto curto, sem caixa ocupando altura. */
export function VazioGrupoTickets({ children }: { children: ReactNode }) {
  return <p className="py-2 text-center text-sm text-white/45">{children}</p>;
}

/**
 * Recebidos dentro do card "Meus tickets": com novidade primeiro, depois os do setor sem responsável
 * (com Assumir) e os demais por última atualização. "Em que participei" fica recolhido no fim.
 */
export function GruposRecebidos({ onAbrir }: { onAbrir: (ticket: Ticket) => void }) {
  const { classificados, novidades, referencias } = useTicketsUsuario();
  const { assumindo, assumir } = useAssumirTicket();
  if (!referencias) return null;

  const { semResponsavelDoSetor, recebidos, participei } = classificados;
  const semResponsavel = new Set(semResponsavelDoSetor.map((t) => t.id));
  const comNovidade = ordenarPorAtualizacao([...semResponsavelDoSetor, ...recebidos].filter((t) => novidades.has(t.id)));
  const setorSemNovidade = ordenarPorAtualizacao(semResponsavelDoSetor.filter((t) => !novidades.has(t.id)));
  const demais = ordenarPorAtualizacao(recebidos.filter((t) => !novidades.has(t.id)));
  const total = semResponsavelDoSetor.length + recebidos.length;

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
    <div className="space-y-3">
      <TituloGrupoTickets>
        Recebidos ({total}) <ContadorNovidades total={comNovidade.length} />
      </TituloGrupoTickets>
      {total === 0 && <VazioGrupoTickets>Nenhum ticket recebido.</VazioGrupoTickets>}
      {comNovidade.length > 0 && lista(comNovidade)}
      {setorSemNovidade.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-white/45">Do meu setor, sem responsável</p>
          {lista(setorSemNovidade)}
        </div>
      )}
      {demais.length > 0 && lista(demais)}

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
    </div>
  );
}
