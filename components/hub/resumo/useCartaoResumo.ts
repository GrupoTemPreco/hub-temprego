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
    if (e.tipo === "recebida") return !envios.carregado || envios.recebidos.some((r) => r.id === e.envioId);
    if (e.tipo === "aceita" || e.tipo === "recusada") {
      const lote = envios.lotes.find((l) => l.id === e.loteId);
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
    if (tipo === "ticket") tickets.abrirBalao(so ? { ticket: uma.ticketNumero! } : { aba: "recebidos" });
    else if (tipo === "aceita") irPara(rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS));
    else if (tipo === "recusada") {
      irPara(so && uma.itemId ? rotaChecklist(usuario.isAdmin, uma.itemId) : rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS));
    } else irPara(rotaChecklist(usuario.isAdmin));
    removerTipo(tipo);
  }

  const linhas = ORDEM.flatMap((tipo) => {
    const doTipo = vigentes.filter((e) => e.tipo === tipo);
    if (doTipo.length === 0) return [];
    return [{ chave: tipo, texto: doTipo.length === 1 ? doTipo[0].frase : PLURAL[tipo](doTipo.length), onAbrir: () => abrir(tipo, doTipo) }];
  });

  /** "Ok": dá ciência dos aceites e recusas mostrados e dispensa o resumo. */
  function ok() {
    const lotes = vigentes.flatMap((e) =>
      e.tipo === "aceita" || e.tipo === "recusada" ? envios.lotes.filter((l) => l.id === e.loteId) : [],
    );
    lotes.forEach((l) => void envios.marcarCiente(l));
    limpar();
  }

  const cartao: AvisoCartao | null =
    linhas.length > 0 ? { chave: "ausencia", origem: "ausencia", titulo: "Enquanto você estava fora", linhas } : null;

  return { cartao, quantidade: vigentes.length, ok };
}
