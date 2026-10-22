import { supabase } from "@/lib/supabase";
import { FILTRO_STATUS_ENCERRADOS, limiteParado } from "@/lib/tickets";
import type { Ticket, TicketCategoria, TicketEvento, TicketPrioridade, TicketStatus } from "@/lib/types/shell";

export type AtalhoTicket = "atrasados" | "parados" | "comigo" | "meus" | "abertos-por-mim" | "sem-responsavel";

/** Quem está consultando: usado nos atalhos "Comigo", "Atribuídos a mim" e "Abertos por mim". */
export type ConsultanteTickets = { id: string; setores: string[] };

export type FiltrosTickets = {
  q: string;
  status: TicketStatus | "";
  categoria: TicketCategoria | "";
  prioridade: TicketPrioridade | "";
  setor: string;
  pessoa: string;
  responsavel: string;
  /** Datas no formato yyyy-mm-dd. */
  de: string;
  ate: string;
  filtro: AtalhoTicket | "";
  encerrados: boolean;
};

export type ContagemAtalhos = Record<AtalhoTicket, number> & { lixeira: number };

/** Ticket com a quantidade de anexos, usado na lista e no kanban. */
export type TicketListagem = Ticket & { total_anexos?: number };

const LIMITE = 500;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function inicioDoDia(data: string) {
  return new Date(`${data}T00:00:00`).toISOString();
}

function fimDoDia(data: string) {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function termoBusca(q: string) {
  return q.trim().replace(/[,()%*]/g, " ").trim();
}

/** Mesma regra de ticketComigo (o "não encerrado" é aplicado à parte): responsável, destino ou setor sem responsável. */
function filtroComigo({ id, setores }: ConsultanteTickets) {
  const condicoes = [`responsavel_id.eq.${id}`, `destino_usuario_id.eq.${id}`];
  if (setores.length) condicoes.push(`and(responsavel_id.is.null,destino_setor_id.in.(${setores.join(",")}))`);
  return condicoes.join(",");
}

export async function listarTickets(
  f: FiltrosTickets,
  usuario: ConsultanteTickets,
  modo: "lista" | "kanban",
): Promise<TicketListagem[]> {
  const agora = new Date().toISOString();
  const usuarioId = usuario.id;
  // A contagem do clipe considera só os anexos que ainda têm arquivo.
  let query = supabase
    .from("tickets")
    .select("*, ticket_anexos(count)")
    .is("ticket_anexos.removido_em", null)
    .is("excluido_em", null);

  // No kanban a coluna "Resolvido" é sempre exibida; só recusado e fechado dependem de "mostrar encerrados".
  if (f.status) query = query.eq("status", f.status);
  else if (!f.encerrados) query = query.not("status", "in", modo === "kanban" ? "(recusado,fechado)" : FILTRO_STATUS_ENCERRADOS);

  if (f.categoria) query = query.eq("categoria", f.categoria);
  if (f.prioridade) query = query.eq("prioridade", f.prioridade);
  if (f.setor) query = query.eq("destino_setor_id", f.setor);
  if (f.pessoa) query = query.eq("destino_usuario_id", f.pessoa);
  if (f.responsavel) query = query.eq("responsavel_id", f.responsavel);
  if (f.de) query = query.gte("criado_em", inicioDoDia(f.de));
  if (f.ate) query = query.lt("criado_em", fimDoDia(f.ate));

  if (f.filtro === "atrasados") query = query.not("status", "in", FILTRO_STATUS_ENCERRADOS).lt("prazo_em", agora);
  if (f.filtro === "parados")
    query = query.not("status", "in", FILTRO_STATUS_ENCERRADOS).lt("atualizado_em", limiteParado().toISOString());
  if (f.filtro === "comigo") query = query.not("status", "in", FILTRO_STATUS_ENCERRADOS).or(filtroComigo(usuario));
  if (f.filtro === "meus") query = query.eq("responsavel_id", usuarioId);
  if (f.filtro === "abertos-por-mim") query = query.eq("autor_id", usuarioId);
  if (f.filtro === "sem-responsavel") query = query.is("responsavel_id", null);

  const termo = termoBusca(f.q);
  if (/^\d+$/.test(termo)) query = query.or(`numero.eq.${termo},titulo.ilike.%${termo}%`);
  else if (termo) query = query.ilike("titulo", `%${termo}%`);

  const { data, error } = await query.order("criado_em", { ascending: false }).limit(LIMITE);
  falhar(error);
  type Linha = Ticket & { ticket_anexos: { count: number }[] | null };
  return ((data ?? []) as Linha[]).map(({ ticket_anexos, ...ticket }) => ({
    ...ticket,
    total_anexos: ticket_anexos?.[0]?.count ?? 0,
  }));
}

export async function contarAtalhos(usuario: ConsultanteTickets): Promise<ContagemAtalhos> {
  const agora = new Date().toISOString();
  const usuarioId = usuario.id;
  const abertos = () =>
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .is("excluido_em", null)
      .not("status", "in", FILTRO_STATUS_ENCERRADOS);

  const resultados = await Promise.all([
    abertos().lt("prazo_em", agora),
    abertos().lt("atualizado_em", limiteParado().toISOString()),
    abertos().or(filtroComigo(usuario)),
    abertos().eq("responsavel_id", usuarioId),
    abertos().eq("autor_id", usuarioId),
    abertos().is("responsavel_id", null),
    supabase.from("tickets").select("id", { count: "exact", head: true }).not("excluido_em", "is", null),
  ]);
  resultados.forEach((r) => falhar(r.error));
  const [atrasados, parados, comigo, meus, abertosPorMim, semResponsavel, lixeira] = resultados.map((r) => r.count ?? 0);
  return {
    atrasados,
    parados,
    comigo,
    meus,
    "abertos-por-mim": abertosPorMim,
    "sem-responsavel": semResponsavel,
    lixeira,
  };
}

export async function listarLixeira(q: string) {
  let query = supabase.from("tickets").select("*").not("excluido_em", "is", null);
  const termo = termoBusca(q);
  if (/^\d+$/.test(termo)) query = query.or(`numero.eq.${termo},titulo.ilike.%${termo}%`);
  else if (termo) query = query.ilike("titulo", `%${termo}%`);

  const { data, error } = await query.order("excluido_em", { ascending: false }).limit(LIMITE);
  falhar(error);
  return (data ?? []) as Ticket[];
}

export async function carregarTicketDetalhe(numero: number) {
  const { data: ticket, error } = await supabase.from("tickets").select("*").eq("numero", numero).maybeSingle();
  falhar(error);
  if (!ticket) return null;

  const { data: eventos, error: eventosError } = await supabase
    .from("ticket_eventos")
    .select("*")
    .eq("ticket_id", ticket.id)
    .order("criado_em", { ascending: true });
  falhar(eventosError);

  return { ticket: ticket as Ticket, eventos: (eventos ?? []) as TicketEvento[] };
}
