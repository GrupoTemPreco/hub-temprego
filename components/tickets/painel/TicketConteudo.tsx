"use client";

import { useState } from "react";
import { AnexosExibicao } from "@/components/tickets/anexos/AnexosExibicao";
import { Lightbox } from "@/components/tickets/anexos/Lightbox";
import { useAnexosTicket, type AnexoExibicao } from "@/hooks/useAnexosTicket";
import type { ResolvedorNomes } from "@/lib/tickets";
import type { Ticket, TicketEvento } from "@/lib/types/shell";
import { TicketCabecalho } from "./TicketCabecalho";
import { TicketTimeline } from "./TicketTimeline";

type Props = {
  ticket: Ticket;
  /** Já filtrados para o papel de quem vê (sem notas internas no modo usuário). */
  eventos: TicketEvento[];
  nomes: ResolvedorNomes;
  versao: number;
};

function agruparPorEvento(anexos: AnexoExibicao[]) {
  const porEvento = new Map<string, AnexoExibicao[]>();
  for (const a of anexos) {
    if (a.evento_id) porEvento.set(a.evento_id, [...(porEvento.get(a.evento_id) ?? []), a]);
  }
  return porEvento;
}

/** Cabeçalho, descrição, anexos e linha do tempo do ticket, com lightbox das imagens. */
export function TicketConteudo({ ticket, eventos, nomes, versao }: Props) {
  const { anexos: todos, erro } = useAnexosTicket(ticket.id, versao);
  const [imagemAberta, setImagemAberta] = useState<string | null>(null);

  // Anexos de eventos ocultos (notas internas) também ficam ocultos.
  const idsEventos = new Set(eventos.map((e) => e.id));
  const anexos = todos.filter((a) => !a.evento_id || idsEventos.has(a.evento_id));
  const imagens = anexos.flatMap((a) => (a.imagem && a.url ? [{ id: a.id, url: a.url, nome: a.nome_arquivo }] : []));
  const indiceImagem = imagens.findIndex((i) => i.id === imagemAberta);

  return (
    <div className="space-y-6 p-5">
      <TicketCabecalho
        ticket={ticket}
        nomes={nomes}
        anexos={<AnexosExibicao anexos={anexos.filter((a) => !a.evento_id)} onAbrirImagem={setImagemAberta} />}
      />
      {erro && <p className="text-xs text-rose-400">Erro ao carregar os anexos: {erro}</p>}
      <TicketTimeline
        ticket={ticket}
        eventos={eventos}
        nomes={nomes}
        anexosPorEvento={agruparPorEvento(anexos)}
        onAbrirImagem={setImagemAberta}
      />

      {indiceImagem >= 0 && (
        <Lightbox
          imagens={imagens}
          indice={indiceImagem}
          onNavegar={(i) => setImagemAberta(imagens[i].id)}
          onFechar={() => setImagemAberta(null)}
        />
      )}
    </div>
  );
}
