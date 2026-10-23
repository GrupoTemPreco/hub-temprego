"use client";

import type { ComponentType, ReactNode } from "react";
import { ChevronRight, Inbox, Send } from "lucide-react";
import { AcaoCard, CardRolavel, TotalCard, VazioCard } from "@/components/ui/CardRolavel";
import { LinhaCards } from "@/components/ui/LinhaCards";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { MeuChecklistCard } from "@/components/checklist/MeuChecklistCard";
import type { DadosChecklist } from "@/components/checklist/useChecklistDados";
import { ListaTicketsUsuario } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";
import { estaEncerrado, nomeDestino, ticketComigo } from "@/lib/tickets";
import type { NavegarAba } from "../abas";

type CardTicketsProps = {
  titulo: string;
  icon: ComponentType<{ className?: string }>;
  total: number;
  onVerTodos: () => void;
  children: ReactNode;
};

function CardTickets({ titulo, icon: Icon, total, onVerTodos, children }: CardTicketsProps) {
  return (
    <CardRolavel
      altura="360"
      titulo={
        <>
          <Icon className="h-4 w-4 text-cyan-300" />
          {titulo}
          <TotalCard total={total} />
        </>
      }
      acao={
        <AcaoCard onClick={onVerTodos}>
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </AcaoCard>
      }
    >
      {children}
    </CardRolavel>
  );
}

type Props = { onNavegar: NavegarAba; checklist: DadosChecklist | null };

/** "Meu checklist", "Comigo" e "Abertos por mim" do admin logado; ?ticket=<numero> abre o painel no modo admin. */
export function MeusItensAdmin({ onNavegar, checklist }: Props) {
  const usuario = useUsuarioAtual();
  const { tickets, novidades, referencias, carregado, versao, atualizar } = useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const abrir = (t: { numero: number }) => ticketUrl.abrir(t.numero);

  const comigo = tickets.filter((t) => ticketComigo(t, usuario.id, usuario.setores));
  const abertosPorMim = tickets.filter((t) => t.autor_id === usuario.id && !estaEncerrado(t.status));
  const pronto = carregado && referencias;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Meus itens</h2>
      <LinhaCards>
        {checklist && <MeuChecklistCard checklist={checklist} />}
        <CardTickets
          titulo="Comigo"
          icon={Inbox}
          total={comigo.length}
          onVerTodos={() => onNavegar("tickets", { filtro: "comigo" })}
        >
          {!pronto ? (
            <VazioCard>Carregando tickets...</VazioCard>
          ) : comigo.length === 0 ? (
            <VazioCard>Nenhum ticket com você.</VazioCard>
          ) : (
            <ListaTicketsUsuario
              tickets={comigo}
              outraParte={(t) => `De ${referencias.nomes.usuario(t.autor_id)}`}
              novidades={novidades}
              onAbrir={abrir}
            />
          )}
        </CardTickets>
        <CardTickets
          titulo="Abertos por mim"
          icon={Send}
          total={abertosPorMim.length}
          onVerTodos={() => onNavegar("tickets", { filtro: "abertos-por-mim" })}
        >
          {!pronto ? (
            <VazioCard>Carregando tickets...</VazioCard>
          ) : abertosPorMim.length === 0 ? (
            <VazioCard>Nenhum ticket aberto por você em andamento.</VazioCard>
          ) : (
            <ListaTicketsUsuario
              tickets={abertosPorMim}
              outraParte={(t) => `Para ${nomeDestino(t, referencias.nomes)}`}
              novidades={novidades}
              onAbrir={abrir}
            />
          )}
        </CardTickets>
      </LinhaCards>

      {ticketUrl.numero && referencias && (
        <TicketDrawer
          key={ticketUrl.numero}
          numero={ticketUrl.numero}
          referencias={referencias}
          versao={versao}
          modo="admin"
          onClose={ticketUrl.fechar}
          onAlterado={atualizar}
        />
      )}
    </section>
  );
}
