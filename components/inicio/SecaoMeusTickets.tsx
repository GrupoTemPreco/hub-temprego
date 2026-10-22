"use client";

import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ListaTicketsUsuario, ordenarPorNovidade } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";
import { nomeDestino } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";
import { ColunaTickets } from "./tickets/ColunaTickets";
import { ColunaRecebidos } from "./tickets/ColunaRecebidos";

/** Âncora usada pelo aviso de tickets do mural ("Ver recebidos"). */
export const ID_SECAO_TICKETS = "meus-tickets";

function Conteudo() {
  const { classificados, mostrarRecebidos, novidades, referencias, carregado, abrirBalao, versao, atualizar } =
    useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const abrir = (t: Ticket) => ticketUrl.abrir(t.numero);
  const meus = ordenarPorNovidade(classificados.meus, novidades);

  return (
    <section id={ID_SECAO_TICKETS} className="scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Meus tickets</h2>
        <Button size="sm" onClick={() => abrirBalao({ aba: "novo" })}>
          <Plus className="h-3.5 w-3.5" /> Abrir ticket
        </Button>
      </div>

      {!carregado || !referencias ? (
        <p className="text-sm text-white/55">Carregando tickets...</p>
      ) : (
        <div className={`grid gap-4 ${mostrarRecebidos ? "lg:grid-cols-2" : ""}`}>
          {mostrarRecebidos && <ColunaRecebidos onAbrir={abrir} />}
          <ColunaTickets
            titulo="Abertos por mim"
            total={meus.length}
            novidades={meus.filter((t) => novidades.has(t.id)).length}
            vazio="Você ainda não abriu nenhum ticket."
          >
            <ListaTicketsUsuario
              tickets={meus}
              ordenar={false}
              outraParte={(t) => `Para ${nomeDestino(t, referencias.nomes)}`}
              novidades={novidades}
              onAbrir={abrir}
            />
          </ColunaTickets>
        </div>
      )}

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

/** Recebidos e Abertos por mim lado a lado no Início; ?ticket=<numero> abre o painel sem sair da tela. */
export function SecaoMeusTickets() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
