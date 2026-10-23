"use client";

import { Plus, Ticket as TicketIcon } from "lucide-react";
import { AcaoCard, CardRolavel, VazioCard } from "@/components/ui/CardRolavel";
import { ListaTicketsUsuario, ordenarPorNovidade } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";
import { nomeDestino } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";
import { GruposRecebidos, TituloGrupoTickets, VazioGrupoTickets } from "./tickets/GruposRecebidos";

/** Âncora usada pelo aviso de tickets do mural ("Ver recebidos"). */
export const ID_SECAO_TICKETS = "meus-tickets";

/**
 * Recebidos e Abertos por mim num card só, com rolagem interna; ?ticket=<numero> abre o painel sem sair da tela.
 * Exige <Suspense> acima (useSearchParams).
 */
export function CardMeusTickets() {
  const { classificados, mostrarRecebidos, novidades, referencias, carregado, abrirBalao, versao, atualizar } =
    useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const abrir = (t: Ticket) => ticketUrl.abrir(t.numero);
  const meus = ordenarPorNovidade(classificados.meus, novidades);

  return (
    <div id={ID_SECAO_TICKETS} className="h-full scroll-mt-6">
      <CardRolavel
        altura="360"
        titulo={
          <>
            <TicketIcon className="h-4 w-4 text-cyan-300" />
            Meus tickets
          </>
        }
        acao={
          <AcaoCard onClick={() => abrirBalao({ aba: "novo" })}>
            <Plus className="h-3.5 w-3.5" /> Abrir ticket
          </AcaoCard>
        }
      >
        {!carregado || !referencias ? (
          <VazioCard>Carregando tickets...</VazioCard>
        ) : (
          <div className="space-y-5">
            {mostrarRecebidos && <GruposRecebidos onAbrir={abrir} />}
            <div>
              <TituloGrupoTickets>Abertos por mim ({meus.length})</TituloGrupoTickets>
              {meus.length === 0 ? (
                <VazioGrupoTickets>Você ainda não abriu nenhum ticket.</VazioGrupoTickets>
              ) : (
                <ListaTicketsUsuario
                  tickets={meus}
                  ordenar={false}
                  outraParte={(t) => `Para ${nomeDestino(t, referencias.nomes)}`}
                  novidades={novidades}
                  onAbrir={abrir}
                />
              )}
            </div>
          </div>
        )}
      </CardRolavel>

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
    </div>
  );
}
