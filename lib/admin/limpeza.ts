import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { formatarTamanho } from "@/lib/format";
import { STATUS_ENCERRADOS } from "@/lib/tickets";
import { BUCKET_ANEXOS } from "@/lib/ticketsAnexos";
import { excluirTicketDefinitivamente } from "./ticketsAcoes";

// Cada ação tem uma prévia (o que será apagado) e a execução, que apaga exatamente o que a prévia listou.

export type Previa<D> = {
  quantidade: number;
  /** Nulo quando não se aplica (ex.: linhas do banco). */
  bytes: number | null;
  /** Itens exibidos na prévia (caminhos, tickets, títulos). */
  itens: string[];
  dados: D;
};

export type ResultadoLimpeza = { quantidade: number; bytes: number | null; falhas: string[] };

export type AcaoLimpeza<D> = {
  previa: (dias: number) => Promise<Previa<D>>;
  executar: (previa: Previa<D>, dias: number, adminId: string) => Promise<ResultadoLimpeza>;
};

const LOTE = 100;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function emLotes<T>(itens: T[], tamanho = LOTE) {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

function antesDe(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

const somar = (valores: Array<number | null | undefined>) => valores.reduce<number>((s, v) => s + Number(v ?? 0), 0);

function registrar(acao: string, descricao: string, dias: number, r: ResultadoLimpeza) {
  return registrarAcao({
    acao,
    alvo_tipo: "sistema",
    alvo_id: null,
    descricao,
    dados: { dias, quantidade: r.quantidade, bytes_liberados: r.bytes, falhas: r.falhas.length },
  });
}

const liberados = (bytes: number | null) => (bytes ? ` (${formatarTamanho(bytes)} liberados)` : "");

/** Apaga do bucket em lotes. Devolve os caminhos confirmados pelo Storage e as falhas. */
async function apagarDoBucket(caminhos: string[]) {
  const apagados = new Set<string>();
  const falhas: string[] = [];
  for (const lote of emLotes(caminhos)) {
    const { data, error } = await supabase.storage.from(BUCKET_ANEXOS).remove(lote);
    if (error) {
      falhas.push(`Lote de ${lote.length} arquivos: ${error.message}`);
      continue;
    }
    const confirmados = new Set((data ?? []).map((o) => o.name));
    for (const c of lote) {
      if (confirmados.has(c)) apagados.add(c);
      else falhas.push(`${c}: o Storage não confirmou a remoção`);
    }
  }
  return { apagados, falhas };
}

// a) Anexos de tickets encerrados há mais de N dias ------------------------------------------

type AnexoParaRemover = { id: string; caminho: string; tamanho_bytes: number | null };

export const anexosDeTicketsEncerrados: AcaoLimpeza<AnexoParaRemover[]> = {
  async previa(dias) {
    const limite = antesDe(dias);
    // Data de encerramento: fechado_em, senão resolvido_em, senão atualizado_em.
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("id")
      .in("status", STATUS_ENCERRADOS)
      .or(
        `fechado_em.lt.${limite},and(fechado_em.is.null,resolvido_em.lt.${limite}),and(fechado_em.is.null,resolvido_em.is.null,atualizado_em.lt.${limite})`,
      );
    falhar(error);

    const ids = (tickets ?? []).map((t) => t.id as string);
    const lotes = await Promise.all(
      emLotes(ids).map((lote) =>
        supabase.from("ticket_anexos").select("id, caminho, tamanho_bytes").in("ticket_id", lote).is("removido_em", null),
      ),
    );
    lotes.forEach((r) => falhar(r.error));
    const anexos = lotes.flatMap((r) => (r.data ?? []) as AnexoParaRemover[]);
    return { quantidade: anexos.length, bytes: somar(anexos.map((a) => a.tamanho_bytes)), itens: [], dados: anexos };
  },

  async executar(previa, dias, adminId) {
    const { apagados, falhas } = await apagarDoBucket(previa.dados.map((a) => a.caminho));
    const removidos = previa.dados.filter((a) => apagados.has(a.caminho));
    const agora = new Date().toISOString();
    let marcados: AnexoParaRemover[] = [];
    for (const lote of emLotes(removidos)) {
      const { error } = await supabase
        .from("ticket_anexos")
        .update({ removido_em: agora, removido_por: adminId })
        .in(
          "id",
          lote.map((a) => a.id),
        );
      if (error) falhas.push(`Arquivos apagados, mas ${lote.length} registros não foram marcados: ${error.message}`);
      else marcados = [...marcados, ...lote];
    }
    const r = { quantidade: marcados.length, bytes: somar(marcados.map((a) => a.tamanho_bytes)), falhas };
    await registrar(
      "limpeza_anexos_encerrados",
      `removeu ${r.quantidade} anexos de tickets encerrados há mais de ${dias} dias${liberados(r.bytes)}`,
      dias,
      r,
    );
    return r;
  },
};

// b) Arquivos órfãos -------------------------------------------------------------------------

type Orfao = { caminho: string; bytes: number | null; criado_em: string | null };

export const arquivosOrfaos: AcaoLimpeza<Orfao[]> = {
  async previa() {
    const { data, error } = await supabase.rpc("anexos_orfaos");
    falhar(error);
    const orfaos = (data ?? []) as Orfao[];
    return { quantidade: orfaos.length, bytes: somar(orfaos.map((o) => o.bytes)), itens: orfaos.map((o) => o.caminho), dados: orfaos };
  },

  async executar(previa, dias) {
    const { apagados, falhas } = await apagarDoBucket(previa.dados.map((o) => o.caminho));
    const ok = previa.dados.filter((o) => apagados.has(o.caminho));
    const r = { quantidade: ok.length, bytes: somar(ok.map((o) => o.bytes)), falhas };
    await registrar("limpeza_arquivos_orfaos", `apagou ${r.quantidade} arquivos órfãos do Storage${liberados(r.bytes)}`, dias, r);
    return r;
  },
};

// c) Esvaziar lixeira ------------------------------------------------------------------------

type TicketLixeira = { id: string; numero: number; titulo: string; bytes: number };

export const esvaziarLixeira: AcaoLimpeza<TicketLixeira[]> = {
  async previa(dias) {
    const { data, error } = await supabase
      .from("tickets")
      .select("id, numero, titulo")
      .not("excluido_em", "is", null)
      .lt("excluido_em", antesDe(dias))
      .order("numero", { ascending: true });
    falhar(error);
    const tickets = (data ?? []) as Omit<TicketLixeira, "bytes">[];

    const lotes = await Promise.all(
      emLotes(tickets.map((t) => t.id)).map((lote) =>
        supabase.from("ticket_anexos").select("ticket_id, tamanho_bytes").in("ticket_id", lote).is("removido_em", null),
      ),
    );
    lotes.forEach((r) => falhar(r.error));
    const bytesPorTicket = new Map<string, number>();
    for (const a of lotes.flatMap((r) => r.data ?? [])) {
      bytesPorTicket.set(a.ticket_id, (bytesPorTicket.get(a.ticket_id) ?? 0) + Number(a.tamanho_bytes ?? 0));
    }

    const comBytes = tickets.map((t) => ({ ...t, bytes: bytesPorTicket.get(t.id) ?? 0 }));
    return {
      quantidade: comBytes.length,
      bytes: somar(comBytes.map((t) => t.bytes)),
      itens: comBytes.map((t) => `#${t.numero} – ${t.titulo}`),
      dados: comBytes,
    };
  },

  async executar(previa, dias) {
    const falhas: string[] = [];
    const excluidos: TicketLixeira[] = [];
    for (const t of previa.dados) {
      try {
        await excluirTicketDefinitivamente(t);
        excluidos.push(t);
      } catch (err) {
        falhas.push(`#${t.numero}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    const r = { quantidade: excluidos.length, bytes: somar(excluidos.map((t) => t.bytes)), falhas };
    const periodo = dias === 0 ? "" : ` excluídos há mais de ${dias} dias`;
    await registrar("limpeza_lixeira", `esvaziou a lixeira: ${r.quantidade} tickets${periodo}${liberados(r.bytes)}`, dias, r);
    return r;
  },
};

// d) Notificações encerradas há mais de N dias -----------------------------------------------

type NotificacaoAntiga = { id: string; titulo: string };

export const notificacoesEncerradas: AcaoLimpeza<NotificacaoAntiga[]> = {
  async previa(dias) {
    const limite = antesDe(dias);
    const { data, error } = await supabase
      .from("notificacoes")
      .select("id, titulo")
      .or(
        `fim_em.lt.${limite},and(ativa.eq.false,atualizado_em.lt.${limite}),and(ativa.eq.false,atualizado_em.is.null,criado_em.lt.${limite})`,
      );
    falhar(error);
    const lista = (data ?? []) as NotificacaoAntiga[];
    return { quantidade: lista.length, bytes: null, itens: lista.map((n) => n.titulo), dados: lista };
  },

  async executar(previa, dias) {
    const falhas: string[] = [];
    let quantidade = 0;
    for (const lote of emLotes(previa.dados.map((n) => n.id))) {
      const { data, error } = await supabase.from("notificacoes").delete().in("id", lote).select("id");
      if (error) falhas.push(`Lote de ${lote.length} notificações: ${error.message}`);
      else quantidade += data?.length ?? 0;
    }
    const r = { quantidade, bytes: null, falhas };
    await registrar("limpeza_notificacoes", `apagou ${quantidade} notificações encerradas há mais de ${dias} dias`, dias, r);
    return r;
  },
};

// e) Log de ações do admin com mais de N dias -----------------------------------------------

export const logAdminAntigo: AcaoLimpeza<{ limite: string }> = {
  async previa(dias) {
    const limite = antesDe(dias);
    const { count, error } = await supabase
      .from("admin_log")
      .select("id", { count: "exact", head: true })
      .lt("criado_em", limite);
    falhar(error);
    return { quantidade: count ?? 0, bytes: null, itens: [], dados: { limite } };
  },

  async executar(previa, dias) {
    const { data, error } = await supabase.from("admin_log").delete().lt("criado_em", previa.dados.limite).select("id");
    falhar(error);
    const r = { quantidade: data?.length ?? 0, bytes: null, falhas: [] };
    // Registrado depois de apagar, para a própria limpeza ficar no log.
    await registrar("limpeza_log_admin", `apagou ${r.quantidade} registros do log de ações com mais de ${dias} dias`, dias, r);
    return r;
  },
};
