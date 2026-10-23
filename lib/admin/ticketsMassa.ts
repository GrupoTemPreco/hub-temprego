import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { dadosDoLog, erroTexto, quantidade, type ResultadoMassa } from "@/lib/acoesMassa";
import { excluirTicketDefinitivamente } from "./ticketsAcoes";
import type { Ticket } from "@/lib/types/shell";

type TicketAlvo = Pick<Ticket, "id" | "numero" | "titulo">;

// Ids por update: evita URLs grandes demais no PostgREST quando a seleção é muito grande.
const IDS_POR_UPDATE = 150;

const rotulo = (t: TicketAlvo) => `#${t.numero}`;
export const ticketsTexto = (n: number) => quantidade(n, "ticket", "tickets");

/**
 * Um update com .in('id', ids) para o banco gravar os eventos de cada ticket (status, encaminhamento,
 * responsável, prioridade, lixeira). Quem não volta no retorno (sem permissão, já apagado) conta como falha.
 */
async function atualizarEmMassa(tickets: TicketAlvo[], campos: Partial<Ticket>): Promise<ResultadoMassa> {
  const resultado: ResultadoMassa = { total: tickets.length, ok: [], falhas: [] };
  for (let i = 0; i < tickets.length; i += IDS_POR_UPDATE) {
    const lote = tickets.slice(i, i + IDS_POR_UPDATE);
    const { data, error } = await supabase
      .from("tickets")
      .update(campos)
      .in(
        "id",
        lote.map((t) => t.id),
      )
      .select("id");
    const atualizados = new Set((data ?? []).map((d) => d.id as string));
    for (const t of lote) {
      if (!error && atualizados.has(t.id)) resultado.ok.push(t.id);
      else resultado.falhas.push({ id: t.id, rotulo: rotulo(t), erro: error?.message ?? "não foi alterado" });
    }
  }
  return resultado;
}

export type AcaoTicketsMassa = {
  acao: string;
  /** Frase do log sem o número, ex.: (n) => `moveu ${n} para a lixeira`. */
  descricao: (n: string) => string;
  campos: Partial<Ticket>;
  extras?: Record<string, unknown>;
};

export async function aplicarEmMassa(tickets: TicketAlvo[], { acao, descricao, campos, extras }: AcaoTicketsMassa) {
  const r = await atualizarEmMassa(tickets, campos);
  if (r.ok.length > 0) {
    await registrarAcao({
      acao,
      alvo_tipo: "ticket",
      alvo_id: null,
      descricao: descricao(ticketsTexto(r.ok.length)),
      dados: dadosDoLog(r, extras),
    });
  }
  return r;
}

/** Usa a rotina individual (arquivos primeiro), um ticket por vez; uma falha não para os demais. */
export async function excluirDefinitivamenteEmMassa(tickets: TicketAlvo[]) {
  const r: ResultadoMassa = { total: tickets.length, ok: [], falhas: [] };
  for (const t of tickets) {
    try {
      await excluirTicketDefinitivamente(t, { registrar: false });
      r.ok.push(t.id);
    } catch (err) {
      r.falhas.push({ id: t.id, rotulo: rotulo(t), erro: erroTexto(err) });
    }
  }
  if (r.ok.length > 0) {
    await registrarAcao({
      acao: "massa_excluir_tickets_definitivo",
      alvo_tipo: "ticket",
      alvo_id: null,
      descricao: `excluiu definitivamente ${ticketsTexto(r.ok.length)}`,
      dados: dadosDoLog(r, {
        numeros: tickets.filter((t) => r.ok.includes(t.id)).map((t) => t.numero),
      }),
    });
  }
  return r;
}
