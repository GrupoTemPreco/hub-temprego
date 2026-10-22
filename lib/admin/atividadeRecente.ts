import { supabase } from "@/lib/supabase";
import { fraseEvento } from "@/lib/tickets";
import { buscarNomesUsuarios } from "./nomes";
import type { AdminLog, Ticket, TicketEvento } from "@/lib/types/shell";

export type AtividadeOrigem = "admin" | "ticket";

export type AtividadeItem = {
  id: string;
  origem: AtividadeOrigem;
  tipo: string;
  autor: string;
  frase: string;
  criadoEm: string;
};

export const ATIVIDADE_POR_PAGINA = 20;
export const ATIVIDADE_MAXIMO = 200;

type TicketResumo = Pick<Ticket, "id" | "numero" | "destino_usuario_id" | "destino_setor_id">;

async function buscarTickets(ids: string[]): Promise<Map<string, TicketResumo>> {
  const mapa = new Map<string, TicketResumo>();
  if (ids.length === 0) return mapa;
  const { data, error } = await supabase
    .from("tickets")
    .select("id, numero, destino_usuario_id, destino_setor_id")
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  for (const t of (data ?? []) as TicketResumo[]) mapa.set(t.id, t);
  return mapa;
}

async function buscarNomesSetores(ids: Array<string | null>): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const mapa = new Map<string, string>();
  if (unicos.length === 0) return mapa;
  const { data, error } = await supabase.from("setores").select("id, nome").in("id", unicos);
  if (error) throw error;
  for (const s of data ?? []) mapa.set(s.id, s.nome);
  return mapa;
}

/**
 * Os `limite` itens mais recentes, juntando log do admin e eventos de tickets.
 * Para "carregar mais", chame de novo com um limite maior: as duas fontes são intercaladas por data,
 * então buscar os N mais recentes de cada uma é o que garante a ordem certa.
 */
export async function carregarAtividadeRecente(
  limite = ATIVIDADE_POR_PAGINA,
): Promise<{ itens: AtividadeItem[]; temMais: boolean }> {
  const [logsRes, eventosRes] = await Promise.all([
    supabase.from("admin_log").select("*").order("criado_em", { ascending: false }).limit(limite),
    supabase
      .from("ticket_eventos")
      .select("*")
      .eq("interno", false)
      .order("criado_em", { ascending: false })
      .limit(limite),
  ]);
  if (logsRes.error) throw logsRes.error;
  if (eventosRes.error) throw eventosRes.error;

  const logs = (logsRes.data ?? []) as AdminLog[];
  const eventos = (eventosRes.data ?? []) as TicketEvento[];
  const tickets = await buscarTickets(eventos.map((e) => e.ticket_id));
  const ticketsLista = [...tickets.values()];

  const [nomesUsuarios, nomesSetores] = await Promise.all([
    buscarNomesUsuarios([
      ...logs.map((l) => l.autor_id),
      ...eventos.flatMap((e) => [e.autor_id, e.de_usuario_id, e.para_usuario_id]),
      ...ticketsLista.map((t) => t.destino_usuario_id),
    ]),
    buscarNomesSetores([
      ...eventos.flatMap((e) => [e.de_setor_id, e.para_setor_id]),
      ...ticketsLista.map((t) => t.destino_setor_id),
    ]),
  ]);

  const nomes = {
    usuario: (id: string | null) => (id && nomesUsuarios.get(id)) || "Usuário",
    setor: (id: string | null) => (id && nomesSetores.get(id)) || "Setor",
  };
  const autor = (id: string | null) => (id && nomesUsuarios.get(id)) || "Sistema";

  const itens: AtividadeItem[] = [
    ...logs.map((l) => ({
      id: `log-${l.id}`,
      origem: "admin" as const,
      tipo: l.acao,
      autor: autor(l.autor_id),
      frase: l.descricao || l.acao,
      criadoEm: l.criado_em,
    })),
    ...eventos.map((e) => {
      const ticket = tickets.get(e.ticket_id);
      return {
        id: `evt-${e.id}`,
        origem: "ticket" as const,
        tipo: e.tipo,
        autor: autor(e.autor_id),
        frase: fraseEvento(e, { nomes, numero: ticket?.numero, ticket }),
        criadoEm: e.criado_em,
      };
    }),
  ];

  const fontesTemMais = logs.length === limite || eventos.length === limite;
  return {
    itens: itens.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).slice(0, limite),
    temMais: limite < ATIVIDADE_MAXIMO && (fontesTemMais || itens.length > limite),
  };
}
