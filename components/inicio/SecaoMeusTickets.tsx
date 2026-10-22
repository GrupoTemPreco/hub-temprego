"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CentralTickets } from "@/components/tickets/usuario/CentralTickets";
import { useTicketsUsuario, type AbaTickets } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";

function Conteudo() {
  const { abrirBalao, referencias, versao, atualizar } = useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const [aba, setAba] = useState<AbaTickets>("meus");

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Meus tickets</h2>
        <Button size="sm" onClick={() => abrirBalao({ aba: "novo" })}>
          <Plus className="h-3.5 w-3.5" /> Abrir ticket
        </Button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/2 p-4">
        <CentralTickets abas={["meus", "recebidos"]} aba={aba} onAba={setAba} onAbrirTicket={ticketUrl.abrir} />
      </div>

      {ticketUrl.numero && referencias && (
        <TicketDrawer
          key={ticketUrl.numero}
          numero={ticketUrl.numero}
          referencias={referencias}
          versao={versao}
          modo="usuario"
          onClose={ticketUrl.fechar}
          onAlterado={atualizar}
        />
      )}
    </section>
  );
}

/** Abas Meus tickets e Recebidos no Início; ?ticket=<numero> abre o painel sem sair da tela. */
export function SecaoMeusTickets() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
