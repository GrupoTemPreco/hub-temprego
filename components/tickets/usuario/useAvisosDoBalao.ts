"use client";

import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { useContagemNoTitulo } from "@/hooks/useContagemNoTitulo";
import { useResumoAusencia } from "@/components/hub/resumo/useResumoAusencia";
import { useCartaoResumo } from "@/components/hub/resumo/useCartaoResumo";
import { chaveEnvio, chaveLista, chaveLote, chaveTicket } from "@/components/hub/resumo/montarResumo";
import type { AvisoCartao } from "./AvisoBalao";
import { useAvisosTickets } from "./useAvisosTickets";

/**
 * Cartões acima do balão: o resumo "Enquanto você estava fora" (quando houver) e um cartão para as
 * novidades em tempo real de tickets e do checklist (uma mostra ela; várias, agrupa).
 * O contador de tudo vai para o título da aba.
 */
export function useAvisosDoBalao() {
  const checklist = useChecklistEnvios().avisos;
  const resumo = useResumoAusencia();
  const tickets = useAvisosTickets({
    outrosAvisos: checklist.lista.length + resumo.entradas.length,
    aguardarResumo: !resumo.pronto,
    resumoTemTickets: resumo.entradas.some((e) => e.tipo === "ticket"),
  });

  // O que já está no cartão de tempo real não se repete no resumo (mesmo envio, lote, lista ou ticket).
  const chavesNoCartao = new Set([
    ...tickets.naoLidos.map((p) => chaveTicket(p.ticketId)),
    ...checklist.lista.flatMap((a) => [
      ...(a.envioRecebidoId ? [chaveEnvio(a.envioRecebidoId)] : []),
      ...(a.loteId ? [chaveLote(a.loteId)] : []),
      ...(a.chave.startsWith("compartilhado:") ? [chaveLista(a.chave.split(":")[1])] : []),
    ]),
  ]);
  const ausencia = useCartaoResumo({
    entradas: resumo.entradas,
    chavesNoCartao,
    removerTipo: resumo.removerTipo,
    limpar: resumo.limpar,
  });

  const total = tickets.naoLidos.length + checklist.lista.length;
  useContagemNoTitulo(total + ausencia.quantidade);

  let aviso: AvisoCartao | null = tickets.lembrete;
  if (total === 1) {
    const [t] = tickets.naoLidos;
    const [c] = checklist.lista;
    aviso = t
      ? { chave: "tempo-real", origem: "tickets", titulo: t.titulo, detalhe: t.detalhe, detalheCortado: t.detalheCortado }
      : { chave: "tempo-real", origem: "checklist", titulo: c.titulo, detalhe: c.detalhe };
  } else if (total > 1) {
    const soTickets = checklist.lista.length === 0;
    const soChecklist = tickets.naoLidos.length === 0;
    aviso = {
      chave: "tempo-real",
      origem: soChecklist ? "checklist" : "tickets",
      titulo: soTickets
        ? `${total} novidades nos seus tickets`
        : soChecklist
          ? `${total} novidades no seu checklist`
          : `${total} novidades`,
      detalhe:
        soTickets || soChecklist ? undefined : `${tickets.naoLidos.length} nos tickets · ${checklist.lista.length} no checklist`,
    };
  }

  function dispensar() {
    tickets.dispensar();
    checklist.dispensar();
  }

  /** Uma novidade: abre o destino dela. Várias: tickets (balão em Recebidos) têm a preferência. */
  function abrir() {
    if (tickets.naoLidos.length === 1 && checklist.lista.length === 0) {
      tickets.abrir(tickets.naoLidos[0].ticketNumero);
    } else if (tickets.naoLidos.length > 0 || tickets.lembrete) {
      tickets.abrir(null);
    } else {
      checklist.abrir(checklist.lista.length === 1 ? checklist.lista[0] : null);
      return;
    }
    checklist.dispensar();
  }

  return {
    aviso,
    balancos: tickets.balancos + checklist.balancos,
    abrir,
    dispensar,
    ausencia: { cartao: ausencia.cartao, ok: ausencia.ok },
  };
}
