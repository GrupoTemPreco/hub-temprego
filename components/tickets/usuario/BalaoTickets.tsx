"use client";

import { Maximize2, MessageSquare } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { CentralTickets } from "./CentralTickets";
import { ContadorNovidades } from "./ContadorNovidades";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";

/** Botão flutuante de tickets, presente em todas as telas do hub (inclusive sobre os iframes). */
export function BalaoTickets() {
  const { balao, abrirBalao, alterarBalao, fecharBalao, novidades, referencias, versao, atualizar } = useTicketsUsuario();
  const { irPara } = useFerramentaAtiva();
  const usuario = useUsuarioAtual();

  /** Leva à seção de tickets do Início (/admin para admin), mantendo o ticket aberto, se houver. */
  function abrirEmTelaCheia() {
    const inicio = usuario.isAdmin ? "/admin" : "/";
    fecharBalao();
    irPara(balao.ticket ? `${inicio}?ticket=${balao.ticket}` : inicio);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => abrirBalao()}
        aria-label="Tickets"
        title="Tickets"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.45)] transition-transform hover:scale-105 hover:bg-blue-500"
      >
        <MessageSquare className="h-6 w-6" />
        <ContadorNovidades total={novidades.size} className="absolute -right-1 -top-1" />
      </button>

      <Drawer
        open={balao.aberto}
        onClose={fecharBalao}
        width="max-w-xl"
        title={
          <span className="flex items-center gap-3">
            <span className="text-base font-semibold text-white">Tickets</span>
            <button
              type="button"
              onClick={abrirEmTelaCheia}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-white/55 hover:bg-white/10 hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Abrir em tela cheia
            </button>
          </span>
        }
      >
        <div className="p-5">
          <CentralTickets
            aba={balao.aba}
            onAba={(aba) => alterarBalao({ aba })}
            onAbrirTicket={(numero, aba) => alterarBalao({ ticket: numero, ...(aba && { aba }) })}
          />
        </div>
      </Drawer>

      {balao.aberto && balao.ticket && referencias && (
        <TicketDrawer
          key={balao.ticket}
          numero={balao.ticket}
          referencias={referencias}
          versao={versao}
          modo="usuario"
          onClose={() => alterarBalao({ ticket: null })}
          onAlterado={atualizar}
        />
      )}
    </>
  );
}
