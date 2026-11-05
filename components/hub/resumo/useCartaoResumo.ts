"use client";

import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import type { AvisoCartao } from "@/components/tickets/usuario/AvisoBalao";
import { PAINEL_ENVIADAS, rotaChecklist } from "@/lib/telaAtual";
import type { EntradaResumo, TipoResumo } from "./montarResumo";

const ORDEM: TipoResumo[] = ["recebida", "aceita", "recusada", "lista", "ticket"];

const PLURAL: Record<TipoResumo, (n: number) => string> = {
  recebida: (n) => `${n} tarefas recebidas`,
  aceita: (n) => `${n} tarefas aceitas`,
  recusada: (n) => `${n} tarefas recusadas`,
  lista: (n) => `${n} listas compartilhadas com você`,
  ticket: (n) => `${n} tickets com novidade`,
};

const SUFIXO_ENVIO: Partial<Record<TipoResumo, string>> = { recebida: "recebidas", aceita: "aceitas", recusada: "recusadas" };

/** "3 listas recebidas" ou "4 tarefas e listas recebidas" quando há envio de lista no meio. */
function textoPlural(tipo: TipoResumo, doTipo: EntradaResumo[]) {
  const listas = doTipo.filter((e) => e.lista).length;
  const sufixo = SUFIXO_ENVIO[tipo];
  if (!sufixo || listas === 0) return PLURAL[tipo](doTipo.length);
  return `${doTipo.length} ${listas === doTipo.length ? "listas" : "tarefas e listas"} ${sufixo}`;
}

type Params = {
  entradas: EntradaResumo[];
  /** Chaves (envio, lote, lista, ticket) que já estão no cartão de tempo real. */
  chavesNoCartao: Set<string>;
  removerTipo: (tipo: TipoResumo) => void;
  limpar: () => void;
};

/** Cartão "Enquanto você estava fora": uma linha por tipo, cada uma com o seu "Abrir". */
export function useCartaoResumo({ entradas, chavesNoCartao, removerTipo, limpar }: Params) {
  const usuario = useUsuarioAtual();
  const { irPara } = useFerramentaAtiva();
  const envios = useChecklistEnvios();
  const tickets = useTicketsUsuario();

  /** Some sozinho o que já foi resolvido em outro lugar (aceita, lida, com ciência). */
  function aindaVale(e: EntradaResumo) {
    if (e.tipo === "recebida") {
      const pendentes = e.lista ? envios.listas.recebidas : envios.recebidos;
      return !envios.carregado || pendentes.some((r) => r.id === e.envioId);
    }
    if (e.tipo === "aceita" || e.tipo === "recusada") {
      const lote = (e.lista ? envios.listas.lotes : envios.lotes).find((l) => l.id === e.loteId);
      if (e.envioId) {
        const linha = lote?.envios.find((x) => x.id === e.envioId);
        return !envios.carregado || Boolean(linha && !linha.ciente_em);
      }
      return !envios.carregado || Boolean(lote && !lote.ciente);
    }
    if (e.tipo === "ticket") return !tickets.carregado || tickets.novidades.has(e.ticketId!);
    return true;
  }

  const vigentes = entradas.filter((e) => !chavesNoCartao.has(e.chave) && aindaVale(e));

  /** Mesmo destino dos avisos em tempo real equivalentes. */
  function abrir(tipo: TipoResumo, doTipo: EntradaResumo[]) {
    const [uma] = doTipo;
    const so = doTipo.length === 1;
    // Envios de lista não aparecem em Enviadas: as respostas deles levam ao checklist.
    const soListas = doTipo.every((e) => e.lista);
    if (tipo === "ticket") tickets.abrirBalao(so ? { ticket: uma.ticketNumero! } : { aba: "recebidos" });
    else if ((tipo === "aceita" || tipo === "recusada") && soListas) irPara(rotaChecklist(usuario.isAdmin));
    else if (tipo === "aceita") {
      irPara(
        so && uma.envioId && uma.itemId
          ? rotaChecklist(usuario.isAdmin, uma.itemId)
          : rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS),
      );
    }
    else if (tipo === "recusada") {
      irPara(so && uma.itemId ? rotaChecklist(usuario.isAdmin, uma.itemId) : rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS));
    } else irPara(rotaChecklist(usuario.isAdmin));
    removerTipo(tipo);
  }

  const linhas = ORDEM.flatMap((tipo) => {
    const doTipo = vigentes.filter((e) => e.tipo === tipo);
    if (doTipo.length === 0) return [];
    return [{ chave: tipo, texto: doTipo.length === 1 ? doTipo[0].frase : textoPlural(tipo, doTipo), onAbrir: () => abrir(tipo, doTipo) }];
  });

  /** "Ok": dá ciência dos aceites e recusas mostrados e dispensa o resumo. */
  function ok() {
    const respostas = vigentes.filter((e) => e.tipo === "aceita" || e.tipo === "recusada");
    const deTarefa = respostas.filter((e) => !e.lista).map((e) => e.loteId);
    const deLista = respostas.filter((e) => e.lista).map((e) => e.loteId);
    envios.lotes.filter((l) => deTarefa.includes(l.id)).forEach((l) => void envios.marcarCiente(l));
    envios.listas.lotes.filter((l) => deLista.includes(l.id)).forEach((l) => void envios.listas.marcarCiente(l));
    limpar();
  }

  const cartao: AvisoCartao | null =
    linhas.length > 0 ? { chave: "ausencia", origem: "ausencia", titulo: "Enquanto você estava fora", linhas } : null;

  return { cartao, quantidade: vigentes.length, ok };
}
