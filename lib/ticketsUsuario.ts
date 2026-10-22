import { supabase } from "@/lib/supabase";
import type { Ticket } from "@/lib/types/shell";

export type DadosTicketsUsuario = {
  /** Tickets fora da lixeira em que a pessoa é autora, destinatária ou participou. */
  tickets: Ticket[];
  participados: string[];
  /** ticket_id -> lido_em */
  leituras: Record<string, string>;
  /** ticket_id -> criado_em do último evento não interno criado por outra pessoa. */
  ultimoEvento: Record<string, string>;
};

const LOTE_IDS = 100;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function emLotes<T>(itens: T[], tamanho = LOTE_IDS) {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

async function ticketsDiretos(usuarioId: string, setores: string[]) {
  const condicoes = [`autor_id.eq.${usuarioId}`, `destino_usuario_id.eq.${usuarioId}`, `responsavel_id.eq.${usuarioId}`];
  if (setores.length) condicoes.push(`destino_setor_id.in.(${setores.join(",")})`);
  const { data, error } = await supabase.from("tickets").select("*").is("excluido_em", null).or(condicoes.join(","));
  falhar(error);
  return (data ?? []) as Ticket[];
}

async function idsParticipados(usuarioId: string) {
  const { data, error } = await supabase
    .from("ticket_eventos")
    .select("ticket_id")
    .or(`autor_id.eq.${usuarioId},de_usuario_id.eq.${usuarioId},para_usuario_id.eq.${usuarioId}`);
  falhar(error);
  return [...new Set((data ?? []).map((e) => e.ticket_id as string))];
}

async function ticketsPorId(ids: string[]) {
  const resultados = await Promise.all(
    emLotes(ids).map((lote) => supabase.from("tickets").select("*").is("excluido_em", null).in("id", lote)),
  );
  resultados.forEach((r) => falhar(r.error));
  return resultados.flatMap((r) => (r.data ?? []) as Ticket[]);
}

async function ultimosEventosDeOutros(ticketIds: string[], usuarioId: string) {
  const resultados = await Promise.all(
    emLotes(ticketIds).map((lote) =>
      supabase
        .from("ticket_eventos")
        .select("ticket_id, criado_em")
        .in("ticket_id", lote)
        .eq("interno", false)
        .neq("autor_id", usuarioId),
    ),
  );
  resultados.forEach((r) => falhar(r.error));
  const ultimo: Record<string, string> = {};
  for (const e of resultados.flatMap((r) => r.data ?? [])) {
    const id = e.ticket_id as string;
    if (!ultimo[id] || e.criado_em > ultimo[id]) ultimo[id] = e.criado_em as string;
  }
  return ultimo;
}

export async function carregarTicketsDoUsuario(usuarioId: string, setores: string[]): Promise<DadosTicketsUsuario> {
  const [diretos, participados, leiturasRes] = await Promise.all([
    ticketsDiretos(usuarioId, setores),
    idsParticipados(usuarioId),
    supabase.from("ticket_leituras").select("ticket_id, lido_em").eq("usuario_id", usuarioId),
  ]);
  falhar(leiturasRes.error);

  const conhecidos = new Set(diretos.map((t) => t.id));
  const extras = await ticketsPorId(participados.filter((id) => !conhecidos.has(id)));
  const tickets = [...diretos, ...extras];

  const leituras: Record<string, string> = {};
  for (const l of leiturasRes.data ?? []) leituras[l.ticket_id as string] = l.lido_em as string;

  return {
    tickets,
    participados,
    leituras,
    ultimoEvento: await ultimosEventosDeOutros(
      tickets.map((t) => t.id),
      usuarioId,
    ),
  };
}

/** Grava (ou atualiza) quando a pessoa abriu o ticket pela última vez. */
export async function marcarTicketLido(ticketId: string, usuarioId: string, lidoEm: string) {
  const { error } = await supabase
    .from("ticket_leituras")
    .upsert({ ticket_id: ticketId, usuario_id: usuarioId, lido_em: lidoEm }, { onConflict: "ticket_id,usuario_id" });
  falhar(error);
}

export function temNovidade(ticketId: string, dados: Pick<DadosTicketsUsuario, "leituras" | "ultimoEvento">) {
  const ultimo = dados.ultimoEvento[ticketId];
  if (!ultimo) return false;
  const lido = dados.leituras[ticketId];
  return !lido || new Date(ultimo).getTime() > new Date(lido).getTime();
}
