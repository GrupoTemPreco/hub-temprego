"use client";

import type { ComponentType, ReactNode } from "react";
import { ChevronRight, Inbox, Send } from "lucide-react";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { ListaTicketsUsuario } from "@/components/tickets/usuario/ListaTicketsUsuario";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";
import { estaEncerrado, nomeDestino, ticketComigo } from "@/lib/tickets";
import type { NavegarAba } from "../abas";

const LIMITE = 5;

type ColunaProps = {
  titulo: string;
  icon: ComponentType<{ className?: string }>;
  onVerTodos: () => void;
  children: ReactNode;
};

function Coluna({ titulo, icon: Icon, onVerTodos, children }: ColunaProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-cyan-300" />
          {titulo}
        </h3>
        <button onClick={onVerTodos} className="inline-flex items-center gap-0.5 text-xs text-cyan-300 hover:text-cyan-200">
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

/** "Comigo" e "Abertos por mim" do admin logado; ?ticket=<numero> abre o painel no modo admin. */
export function MeusTicketsAdmin({ onNavegar }: { onNavegar: NavegarAba }) {
  const usuario = useUsuarioAtual();
  const { tickets, novidades, referencias, carregado, versao, atualizar } = useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const abrir = (t: { numero: number }) => ticketUrl.abrir(t.numero);

  const comigo = tickets.filter((t) => ticketComigo(t, usuario.id, usuario.setores));
  const abertosPorMim = tickets.filter((t) => t.autor_id === usuario.id && !estaEncerrado(t.status));

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Meus tickets</h2>
      {!carregado || !referencias ? (
        <p className="text-sm text-white/55">Carregando tickets...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Coluna titulo="Comigo" icon={Inbox} onVerTodos={() => onNavegar("tickets", { filtro: "comigo" })}>
            <ListaTicketsUsuario
              tickets={comigo}
              outraParte={(t) => `De ${referencias.nomes.usuario(t.autor_id)}`}
              novidades={novidades}
              onAbrir={abrir}
              limite={LIMITE}
              vazio="Nenhum ticket com você."
            />
          </Coluna>
          <Coluna
            titulo="Abertos por mim"
            icon={Send}
            onVerTodos={() => onNavegar("tickets", { filtro: "abertos-por-mim" })}
          >
            <ListaTicketsUsuario
              tickets={abertosPorMim}
              outraParte={(t) => `Para ${nomeDestino(t, referencias.nomes)}`}
              novidades={novidades}
              onAbrir={abrir}
              limite={LIMITE}
              vazio="Nenhum ticket aberto por você em andamento."
            />
          </Coluna>
        </div>
      )}

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
