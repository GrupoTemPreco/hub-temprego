"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useTicketsRealtime, type MudancaTicket } from "@/hooks/useTicketsRealtime";
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
  /** Quando a pessoa abriu o ticket pela última vez (ticket_leituras), se já abriu. */
  ultimaLeitura: (ticketId: string) => string | undefined;
  balao: EstadoBalao;
  abrirBalao: (opcoes?: { aba?: AbaTickets; ticket?: number | null }) => void;
  alterarBalao: (mudancas: Partial<Omit<EstadoBalao, "aberto">>) => void;
  fecharBalao: () => void;
  /** Recebe cada registro que chega pelo Realtime. Devolve a função para cancelar. */
  assinarMudancas: (ouvinte: (mudanca: MudancaTicket) => void) => () => void;
  /** Chamado pelo painel do ticket enquanto estiver aberto. Devolve a função para desregistrar. */
  registrarPainelAberto: (ticketId: string) => () => void;
  painelEstaAberto: (ticketId: string) => boolean;
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
  const ouvintesRef = useRef(new Set<(mudanca: MudancaTicket) => void>());
  const paineisRef = useRef(new Map<string, number>());
  const avisarOuvintes = useCallback((m: MudancaTicket) => ouvintesRef.current.forEach((ouvinte) => ouvinte(m)), []);
  const { versao, atualizar } = useTicketsRealtime(avisarOuvintes);

  const assinarMudancas = useCallback((ouvinte: (mudanca: MudancaTicket) => void) => {
    ouvintesRef.current.add(ouvinte);
    return () => {
      ouvintesRef.current.delete(ouvinte);
    };
  }, []);

  const registrarPainelAberto = useCallback((ticketId: string) => {
    const paineis = paineisRef.current;
    paineis.set(ticketId, (paineis.get(ticketId) ?? 0) + 1);
    return () => {
      const restantes = (paineis.get(ticketId) ?? 1) - 1;
      if (restantes > 0) paineis.set(ticketId, restantes);
      else paineis.delete(ticketId);
    };
  }, []);

  const painelEstaAberto = useCallback((ticketId: string) => paineisRef.current.has(ticketId), []);
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
      ultimaLeitura: (ticketId) => dados?.leituras[ticketId],
      balao,
      abrirBalao: (opcoes) =>
        setBalao((b) => ({ aberto: true, aba: opcoes?.aba ?? b.aba, ticket: opcoes?.ticket ?? null })),
      alterarBalao: (mudancas) => setBalao((b) => ({ ...b, ...mudancas })),
      fecharBalao: () => setBalao((b) => ({ ...b, aberto: false, ticket: null })),
      assinarMudancas,
      registrarPainelAberto,
      painelEstaAberto,
    };
  }, [
    dados,
    referencias,
    versao,
    atualizar,
    contextoDe,
    marcarLido,
    balao,
    usuario.setores,
    usuario.recebeTickets,
    assinarMudancas,
    registrarPainelAberto,
    painelEstaAberto,
  ]);

  return <TicketsUsuarioContext.Provider value={valor}>{children}</TicketsUsuarioContext.Provider>;
}

export function useTicketsUsuario(): TicketsUsuarioApi {
  const ctx = useContext(TicketsUsuarioContext);
  if (!ctx) throw new Error("useTicketsUsuario precisa estar dentro de <TicketsUsuarioProvider>.");
  return ctx;
}
