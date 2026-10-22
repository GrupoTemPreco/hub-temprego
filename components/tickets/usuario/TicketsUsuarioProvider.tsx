"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useTicketsRealtime } from "@/hooks/useTicketsRealtime";
import { carregarReferencias, type Referencias } from "@/lib/ticketsApi";
import {
  carregarTicketsDoUsuario,
  marcarTicketLido,
  temNovidade,
  type DadosTicketsUsuario,
} from "@/lib/ticketsUsuario";
import {
  classificarTicketsDoUsuario,
  type ContextoUsuarioTicket,
  type TicketsClassificados,
} from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";

export type AbaTickets = "novo" | "meus" | "recebidos";
type EstadoBalao = { aberto: boolean; aba: AbaTickets; ticket: number | null };

type TicketsUsuarioApi = {
  /** Muda a cada alteração recebida pelo Realtime (tickets, eventos e anexos). */
  versao: number;
  atualizar: () => void;
  referencias: Referencias | null;
  carregado: boolean;
  tickets: Ticket[];
  classificados: TicketsClassificados<Ticket>;
  mostrarRecebidos: boolean;
  novidades: Set<string>;
  contextoDe: (ticket: Pick<Ticket, "id">) => ContextoUsuarioTicket;
  marcarLido: (ticketId: string) => void;
  balao: EstadoBalao;
  abrirBalao: (opcoes?: { aba?: AbaTickets; ticket?: number | null }) => void;
  alterarBalao: (mudancas: Partial<Omit<EstadoBalao, "aberto">>) => void;
  fecharBalao: () => void;
};

const TicketsUsuarioContext = createContext<TicketsUsuarioApi | null>(null);

const maisRecente = (a: string | undefined, b: string | undefined) =>
  !a ? b : !b ? a : new Date(a).getTime() >= new Date(b).getTime() ? a : b;

/** Mantém a leitura local mais recente quando a do banco ainda não chegou. */
function mesclarLeituras(locais: Record<string, string> = {}, servidor: Record<string, string>) {
  const r = { ...servidor };
  for (const [id, lido] of Object.entries(locais)) r[id] = maisRecente(lido, r[id])!;
  return r;
}

export function TicketsUsuarioProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuarioAtual();
  const { versao, atualizar } = useTicketsRealtime();
  const [referencias, setReferencias] = useState<Referencias | null>(null);
  const [dados, setDados] = useState<DadosTicketsUsuario | null>(null);
  const [balao, setBalao] = useState<EstadoBalao>({ aberto: false, aba: "meus", ticket: null });
  const dadosRef = useRef(dados);

  useEffect(() => {
    carregarReferencias()
      .then(setReferencias)
      .catch((err) => console.error("[tickets] Falha ao carregar usuários e setores:", err));
  }, []);

  useEffect(() => {
    let ativo = true;
    carregarTicketsDoUsuario(usuario.id, usuario.setores)
      .then((novos) => {
        if (ativo) setDados((prev) => ({ ...novos, leituras: mesclarLeituras(prev?.leituras, novos.leituras) }));
      })
      .catch((err) => console.error("[tickets] Falha ao carregar tickets do usuário:", err));
    return () => {
      ativo = false;
    };
  }, [usuario.id, usuario.setores, versao]);

  useEffect(() => {
    dadosRef.current = dados;
  }, [dados]);

  const marcarLido = useCallback(
    (ticketId: string) => {
      const lidoEm = maisRecente(new Date().toISOString(), dadosRef.current?.ultimoEvento[ticketId])!;
      setDados((prev) => prev && { ...prev, leituras: { ...prev.leituras, [ticketId]: lidoEm } });
      marcarTicketLido(ticketId, usuario.id, lidoEm).catch((err) =>
        console.error("[tickets] Falha ao registrar leitura:", err),
      );
    },
    [usuario.id],
  );

  const participados = useMemo(() => new Set(dados?.participados ?? []), [dados]);
  const contextoDe = useCallback(
    (ticket: Pick<Ticket, "id">): ContextoUsuarioTicket => ({
      usuarioId: usuario.id,
      setores: usuario.setores,
      participou: participados.has(ticket.id),
    }),
    [usuario.id, usuario.setores, participados],
  );

  const valor = useMemo<TicketsUsuarioApi>(() => {
    const tickets = dados?.tickets ?? [];
    const classificados = classificarTicketsDoUsuario(tickets, contextoDe);
    const membroDeSetorAtivo = Boolean(
      referencias?.setores.some((s) => s.ativo && usuario.setores.includes(s.id)),
    );
    return {
      versao,
      atualizar,
      referencias,
      carregado: dados !== null,
      tickets,
      classificados,
      mostrarRecebidos:
        classificados.recebidos.length + classificados.semResponsavelDoSetor.length + classificados.participei.length >
          0 ||
        membroDeSetorAtivo ||
        usuario.recebeTickets,
      novidades: new Set(dados ? tickets.filter((t) => temNovidade(t.id, dados)).map((t) => t.id) : []),
      contextoDe,
      marcarLido,
      balao,
      abrirBalao: (opcoes) =>
        setBalao((b) => ({ aberto: true, aba: opcoes?.aba ?? b.aba, ticket: opcoes?.ticket ?? null })),
      alterarBalao: (mudancas) => setBalao((b) => ({ ...b, ...mudancas })),
      fecharBalao: () => setBalao((b) => ({ ...b, aberto: false, ticket: null })),
    };
  }, [dados, referencias, versao, atualizar, contextoDe, marcarLido, balao, usuario.setores, usuario.recebeTickets]);

  return <TicketsUsuarioContext.Provider value={valor}>{children}</TicketsUsuarioContext.Provider>;
}

export function useTicketsUsuario(): TicketsUsuarioApi {
  const ctx = useContext(TicketsUsuarioContext);
  if (!ctx) throw new Error("useTicketsUsuario precisa estar dentro de <TicketsUsuarioProvider>.");
  return ctx;
}
