"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUsuarioAtual, type UsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { useSom } from "@/components/hub/SomNotificacaoProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { MudancaTicket } from "@/hooks/useTicketsRealtime";
import type { Referencias } from "@/lib/ticketsApi";
import type { Ticket } from "@/lib/types/shell";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";
import type { AvisoCartao } from "./AvisoBalao";

/** Aviso em tempo real ainda não dispensado (guardado no localStorage). */
export type AvisoPendente = {
  /** Tabela + id do registro, para não repetir o mesmo aviso. */
  chave: string;
  ticketId: string;
  ticketNumero: number;
  titulo: string;
  detalhe?: string;
  detalheCortado?: boolean;
  recebidoEm: string;
};

const LEMBRETE_DURACAO_MS = 6000;
const LEMBRETE_INTERVALO_MS = 30 * 60 * 1000;
const LEMBRETE_ATRASO_MS = 1500;

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;
const chaveLembrete = (usuarioId: string) => `hub:lembrete-tickets:${usuarioId}`;
const chavePendentes = (usuarioId: string) => `hub:avisos-tickets:${usuarioId}`;

function podeLembrar(usuarioId: string) {
  try {
    const ultimo = Number(window.localStorage.getItem(chaveLembrete(usuarioId)) ?? 0);
    return Date.now() - ultimo >= LEMBRETE_INTERVALO_MS;
  } catch {
    return true;
  }
}

function registrarLembrete(usuarioId: string) {
  try {
    window.localStorage.setItem(chaveLembrete(usuarioId), String(Date.now()));
  } catch {
    // Sem localStorage, o lembrete pode voltar no próximo carregamento.
  }
}

function lerPendentes(usuarioId: string): AvisoPendente[] {
  try {
    const lista = JSON.parse(window.localStorage.getItem(chavePendentes(usuarioId)) ?? "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarPendentes(usuarioId: string, lista: AvisoPendente[]) {
  try {
    if (lista.length) window.localStorage.setItem(chavePendentes(usuarioId), JSON.stringify(lista));
    else window.localStorage.removeItem(chavePendentes(usuarioId));
  } catch {
    // Sem localStorage, os avisos não sobrevivem ao recarregamento.
  }
}

type Contexto = { usuario: UsuarioAtual; tickets: Ticket[]; referencias: Referencias | null };

/** Transforma um registro do Realtime em aviso, ou nulo se não for para esta pessoa. */
function interpretar(m: MudancaTicket, ctx: Contexto, painelEstaAberto: (id: string) => boolean): AvisoPendente | null {
  if (m.tipo !== "INSERT") return null;
  const { usuario, tickets, referencias } = ctx;
  const nome = (id: unknown) => referencias?.nomes.usuario((id as string | null) ?? null) ?? "Alguém";
  const recebidoEm = (m.novo.criado_em as string | undefined) ?? new Date().toISOString();

  if (m.tabela === "tickets") {
    const t = m.novo as Partial<Ticket>;
    const paraMim =
      t.destino_usuario_id === usuario.id || (Boolean(t.destino_setor_id) && usuario.setores.includes(t.destino_setor_id!));
    if (!t.id || !t.numero || t.autor_id === usuario.id || t.excluido_em || !paraMim || painelEstaAberto(t.id)) return null;
    return {
      chave: `ticket:${t.id}`,
      ticketId: t.id,
      ticketNumero: t.numero,
      titulo: `Novo ticket #${t.numero} de ${nome(t.autor_id)}`,
      detalhe: t.titulo,
      detalheCortado: true,
      recebidoEm,
    };
  }

  if (m.tabela === "ticket_eventos") {
    const e = m.novo;
    if (e.tipo !== "mensagem" || e.autor_id === usuario.id || (e.interno && !usuario.isAdmin)) return null;
    const ticket = tickets.find((t) => t.id === e.ticket_id);
    if (!ticket || painelEstaAberto(ticket.id)) return null;
    return {
      chave: `evento:${e.id}`,
      ticketId: ticket.id,
      ticketNumero: ticket.numero,
      titulo: `${nome(e.autor_id)} respondeu o ticket #${ticket.numero}`,
      recebidoEm,
    };
  }
  return null;
}

/**
 * Avisos de tickets que saem do balão (o cartão junta estes com os do checklist em useAvisosDoBalao).
 * - Tempo real (ticket ou resposta nova): ficam até "Ok"/"Abrir", sobrevivem ao recarregamento
 *   e saem sozinhos quando o ticket é aberto. Tocam som e balançam o balão a cada chegada.
 * - Lembrete de pendências ao carregar: sem som, some em 6 s, no máximo a cada 30 minutos.
 * Dispensar não marca o ticket como lido.
 */
type Opcoes = {
  outrosAvisos: number;
  /** O resumo "Enquanto você estava fora" ainda está sendo montado: o lembrete espera. */
  aguardarResumo: boolean;
  /** O resumo trouxe tickets: ele substitui o lembrete ao carregar. */
  resumoTemTickets: boolean;
};

export function useAvisosTickets({ outrosAvisos, aguardarResumo, resumoTemTickets }: Opcoes) {
  const { tocar: tocarSom } = useSom();
  const usuario = useUsuarioAtual();
  const pathname = usePathname();
  const { ativa } = useFerramentaAtiva();
  const isMobile = useIsMobile();
  const {
    tickets,
    referencias,
    carregado,
    novidades,
    classificados,
    assinarMudancas,
    painelEstaAberto,
    ultimaLeitura,
    abrirBalao,
  } = useTicketsUsuario();
  const [pendentes, setPendentes] = useState<AvisoPendente[]>(() => lerPendentes(usuario.id));
  const [lembrete, setLembrete] = useState<AvisoCartao | null>(null);
  const [balancos, setBalancos] = useState(0);

  const contextoRef = useRef<Contexto>({ usuario, tickets, referencias });
  const lembreteRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lembreteDecididoRef = useRef(false);

  useEffect(() => {
    contextoRef.current = { usuario, tickets, referencias };
  }, [usuario, tickets, referencias]);

  useEffect(() => () => clearTimeout(lembreteRef.current), []);

  // Avisos de tickets abertos (lidos) depois de chegarem saem da lista.
  const naoLidos = useMemo(
    () =>
      pendentes.filter((p) => {
        const lido = ultimaLeitura(p.ticketId);
        return !lido || new Date(lido).getTime() < new Date(p.recebidoEm).getTime();
      }),
    [pendentes, ultimaLeitura],
  );

  useEffect(() => salvarPendentes(usuario.id, naoLidos), [usuario.id, naoLidos]);

  // 1. Tempo real
  useEffect(
    () =>
      assinarMudancas((m) => {
        const item = interpretar(m, contextoRef.current, painelEstaAberto);
        if (!item) return;
        setPendentes((prev) => (prev.some((p) => p.chave === item.chave) ? prev : [...prev, item]));
        setBalancos((n) => n + 1);
        tocarSom();
      }),
    [assinarMudancas, painelEstaAberto, tocarSom],
  );

  // 2. Lembrete ao carregar (decide uma vez, depois que os dados chegam)
  const inicioNaTela = pathname === "/" && !ativa && !usuario.isAdmin && !isMobile;
  useEffect(() => {
    if (!carregado || aguardarResumo || lembreteDecididoRef.current) return;
    lembreteDecididoRef.current = true;
    const comNovidade = novidades.size;
    const semResponsavel = classificados.semResponsavelDoSetor.length;
    const temAvisoNaTela = naoLidos.length + outrosAvisos > 0;
    if (resumoTemTickets) return;
    if (temAvisoNaTela || inicioNaTela || (comNovidade === 0 && semResponsavel === 0) || !podeLembrar(usuario.id)) return;

    const linhas = [
      comNovidade > 0 && `Você tem ${plural(comNovidade, "ticket", "tickets")} com novidades`,
      semResponsavel > 0 &&
        `${plural(semResponsavel, "ticket do seu setor", "tickets do seu setor")} aguardando alguém assumir`,
    ].filter((l): l is string => Boolean(l));
    lembreteRef.current = setTimeout(() => {
      registrarLembrete(usuario.id);
      setLembrete({ chave: "lembrete", origem: "tickets", titulo: linhas[0], detalhe: linhas[1] });
    }, LEMBRETE_ATRASO_MS);
  }, [
    carregado,
    aguardarResumo,
    resumoTemTickets,
    novidades,
    classificados,
    inicioNaTela,
    naoLidos.length,
    outrosAvisos,
    usuario.id,
  ]);

  // Só o lembrete some sozinho.
  useEffect(() => {
    if (!lembrete) return;
    const id = setTimeout(() => setLembrete(null), LEMBRETE_DURACAO_MS);
    return () => clearTimeout(id);
  }, [lembrete]);

  const dispensar = useCallback(() => {
    setPendentes([]);
    setLembrete(null);
  }, []);

  /** Abre o ticket (ou o balão em Recebidos, quando nulo) e dispensa os avisos de tickets. */
  const abrir = useCallback(
    (ticketNumero: number | null) => {
      if (ticketNumero) abrirBalao({ ticket: ticketNumero });
      else abrirBalao({ aba: "recebidos" });
      dispensar();
    },
    [abrirBalao, dispensar],
  );

  return { naoLidos, lembrete, balancos, abrir, dispensar };
}
