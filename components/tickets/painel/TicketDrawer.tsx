"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { avisarFalhasAnexos } from "@/components/tickets/anexos/avisarFalhasAnexos";
import { carregarTicketDetalhe } from "@/lib/admin/ticketsConsulta";
import * as acoes from "@/lib/admin/ticketsAcoes";
import type { Referencias, UsuarioReferencia } from "@/lib/ticketsApi";
import { responderComAnexos, type AoProgredir, type ArquivoParaEnvio, type FalhaAnexo } from "@/lib/ticketsAnexos";
import {
  PERMISSOES_ADMIN,
  permissoesDoUsuario,
  rotuloCategoria,
  rotuloPrioridade,
  rotuloStatusTicket,
  usuarioVeTicket,
} from "@/lib/tickets";
import type { Ticket, TicketEvento } from "@/lib/types/shell";
import { TicketConteudo } from "./TicketConteudo";
import { TicketResposta } from "./TicketResposta";
import { TicketAcoes } from "./TicketAcoes";
import { EncaminharModal } from "./EncaminharModal";

/** "admin": painel completo. "usuario": esconde notas internas e limita as ações ao papel da pessoa. */
export type ModoPainel = "admin" | "usuario";

type Props = {
  numero: number;
  referencias: Referencias;
  versao: number;
  modo?: ModoPainel;
  onClose: () => void;
  onAlterado: () => void;
};

type Detalhe = { ticket: Ticket; eventos: TicketEvento[] } | null | "carregando";

const recebeTickets = (u: UsuarioReferencia) => u.status === "aprovado" && Boolean(u.recebe_tickets);

export function TicketDrawer({ numero, referencias, versao, modo = "admin", onClose, onAlterado }: Props) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const { contextoDe, marcarLido, registrarPainelAberto } = useTicketsUsuario();
  const [detalhe, setDetalhe] = useState<Detalhe>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [encaminhando, setEncaminhando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarTicketDetalhe(numero)
      .then((d) => ativo && setDetalhe(d))
      .catch((err) => {
        if (!ativo) return;
        toast.error(`Erro ao carregar o ticket: ${err.message}`);
        setDetalhe(null);
      });
    return () => {
      ativo = false;
    };
  }, [numero, versao, toast]);

  const ticket = detalhe && detalhe !== "carregando" ? detalhe.ticket : null;
  const visivel = Boolean(ticket && (modo === "admin" || usuarioVeTicket(ticket, contextoDe(ticket))));

  useEffect(() => {
    if (ticket && visivel) marcarLido(ticket.id);
  }, [ticket, visivel, marcarLido]);

  // Enquanto o painel estiver aberto, os avisos do balão não falam deste ticket.
  const ticketId = ticket?.id ?? null;
  useEffect(() => (ticketId && visivel ? registrarPainelAberto(ticketId) : undefined), [ticketId, visivel, registrarPainelAberto]);

  async function executar(acao: () => Promise<void>, sucesso: string): Promise<boolean> {
    setOcupado(true);
    try {
      await acao();
      toast.success(sucesso);
      onAlterado();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const titulo = <span className="font-mono">Ticket #{numero}</span>;

  if (!ticket || !visivel) {
    return (
      <Drawer open onClose={onClose} title={titulo} width="max-w-2xl">
        {detalhe === "carregando" ? (
          <p className="p-5 text-sm text-white/60">Carregando ticket...</p>
        ) : (
          <EmptyState
            title="Ticket não encontrado"
            description={
              modo === "admin"
                ? `Não existe um ticket com o número #${numero}.`
                : `O ticket #${numero} não existe ou você não tem acesso a ele.`
            }
          />
        )}
      </Drawer>
    );
  }

  const permissoes = modo === "admin" ? PERMISSOES_ADMIN : permissoesDoUsuario(ticket, contextoDe(ticket));
  const todosEventos = detalhe !== "carregando" && detalhe ? detalhe.eventos : [];
  const eventos = permissoes.verInternos ? todosEventos : todosEventos.filter((e) => !e.interno);

  const responder = async (mensagem: string, interno: boolean, arquivos: ArquivoParaEnvio[], aoProgredir: AoProgredir) => {
    const nota = interno && permissoes.notaInterna;
    let falhas: FalhaAnexo[] = [];
    const ok = await executar(async () => {
      falhas = await responderComAnexos(ticket.id, mensagem, nota, usuario.id, arquivos, aoProgredir);
    }, nota ? "Nota interna adicionada." : "Resposta enviada.");
    avisarFalhasAnexos(toast, falhas, usuario.id);
    return ok;
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={titulo}
      width="max-w-2xl"
      footer={
        <>
          <TicketAcoes
            ticket={ticket}
            usuarioId={usuario.id}
            permissoes={permissoes}
            ocupado={ocupado}
            onAssumir={() => executar(() => acoes.assumirTicket(ticket.id, usuario.id), "Você assumiu o ticket.")}
            onStatus={(s) =>
              executar(() => acoes.mudarStatusTicket(ticket.id, s), `Status alterado para ${rotuloStatusTicket(s)}.`)
            }
            onPrioridade={(p) =>
              executar(() => acoes.mudarPrioridadeTicket(ticket.id, p), `Prioridade alterada para ${rotuloPrioridade(p)}.`)
            }
            onCategoria={(c) =>
              executar(() => acoes.mudarCategoriaTicket(ticket.id, c), `Categoria alterada para ${rotuloCategoria(c)}.`)
            }
            onEncaminhar={() => setEncaminhando(true)}
            onExcluir={() => setConfirmarExclusao(true)}
            onRestaurar={() => executar(() => acoes.restaurarTicket(ticket.id), "Ticket restaurado.")}
          />
          {!ticket.excluido_em && permissoes.responder && (
            <TicketResposta permitirNotaInterna={permissoes.notaInterna} onEnviar={responder} />
          )}
        </>
      }
    >
      <TicketConteudo ticket={ticket} eventos={eventos} nomes={referencias.nomes} versao={versao} />

      {encaminhando && (
        <EncaminharModal
          ticket={ticket}
          referencias={referencias}
          filtrarPessoa={modo === "admin" || usuario.isAdmin ? undefined : recebeTickets}
          onClose={() => setEncaminhando(false)}
          onConfirmar={(destino, mensagem) =>
            executar(() => acoes.encaminharTicket(ticket.id, destino, mensagem, usuario.id), "Ticket encaminhado.")
          }
        />
      )}

      {permissoes.gerenciar && (
        <ConfirmDialog
          open={confirmarExclusao}
          danger
          title="Mover para a lixeira?"
          description={`O ticket #${ticket.numero} sai da lista e pode ser restaurado pela Lixeira.`}
          confirmLabel="Mover para a lixeira"
          loading={ocupado}
          onConfirm={async () => {
            const ok = await executar(() => acoes.moverParaLixeira(ticket.id, usuario.id), "Ticket movido para a lixeira.");
            if (ok) setConfirmarExclusao(false);
          }}
          onCancel={() => setConfirmarExclusao(false)}
        />
      )}
    </Drawer>
  );
}
