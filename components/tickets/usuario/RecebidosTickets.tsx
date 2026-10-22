"use client";

import type { ReactNode } from "react";
import type { Ticket } from "@/lib/types/shell";
import { BotaoAssumir, useAssumirTicket } from "./AssumirTicket";
import { ListaTicketsUsuario } from "./ListaTicketsUsuario";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{titulo}</h3>
      {children}
    </section>
  );
}

export function RecebidosTickets({ onAbrir }: { onAbrir: (ticket: Ticket) => void }) {
  const { classificados, novidades, referencias } = useTicketsUsuario();
  const { assumindo, assumir } = useAssumirTicket();
  if (!referencias) return null;
  const deQuem = (t: Ticket) => `De ${referencias.nomes.usuario(t.autor_id)}`;

  return (
    <div className="space-y-5">
      {classificados.semResponsavelDoSetor.length > 0 && (
        <Secao titulo="Do meu setor, sem responsável">
          <ListaTicketsUsuario
            tickets={classificados.semResponsavelDoSetor}
            outraParte={deQuem}
            novidades={novidades}
            onAbrir={onAbrir}
            acao={(t) => <BotaoAssumir ticket={t} assumindo={assumindo} onAssumir={assumir} />}
          />
        </Secao>
      )}

      <Secao titulo="Recebidos">
        <ListaTicketsUsuario
          tickets={classificados.recebidos}
          outraParte={deQuem}
          novidades={novidades}
          onAbrir={onAbrir}
          vazio="Nenhum ticket recebido."
        />
      </Secao>

      {classificados.participei.length > 0 && (
        <Secao titulo="Em que participei">
          <ListaTicketsUsuario
            tickets={classificados.participei}
            outraParte={deQuem}
            novidades={novidades}
            onAbrir={onAbrir}
          />
        </Secao>
      )}
    </div>
  );
}
