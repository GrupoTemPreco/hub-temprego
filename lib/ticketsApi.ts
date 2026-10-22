import { supabase } from "@/lib/supabase";
import type { ResolvedorNomes } from "@/lib/tickets";
import type { Setor, Ticket, TicketCategoria, TicketPrioridade, Usuario } from "@/lib/types/shell";

export type UsuarioReferencia = Pick<Usuario, "id" | "nome" | "email" | "status" | "recebe_tickets">;
export type SetorReferencia = Pick<Setor, "id" | "nome" | "ativo">;

export type Referencias = {
  usuarios: UsuarioReferencia[];
  setores: SetorReferencia[];
  nomes: ResolvedorNomes;
};

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function criarResolvedor(usuarios: UsuarioReferencia[], setores: SetorReferencia[]): ResolvedorNomes {
  const u = new Map(usuarios.map((x) => [x.id, x.nome || x.email || "Usuário"]));
  const s = new Map(setores.map((x) => [x.id, x.nome]));
  return {
    usuario: (id) => (id ? u.get(id) ?? "Usuário removido" : "—"),
    setor: (id) => (id ? s.get(id) ?? "Setor removido" : "—"),
  };
}

/** Usuários e setores usados para exibir nomes e montar os destinos de tickets. */
export async function carregarReferencias(): Promise<Referencias> {
  const [usuariosRes, setoresRes] = await Promise.all([
    supabase.from("usuarios").select("id, nome, email, status, recebe_tickets").order("nome", { ascending: true }),
    supabase.from("setores").select("id, nome, ativo").order("nome", { ascending: true }),
  ]);
  falhar(usuariosRes.error);
  falhar(setoresRes.error);
  const usuarios = (usuariosRes.data ?? []) as UsuarioReferencia[];
  const setores = (setoresRes.data ?? []) as SetorReferencia[];
  return { usuarios, setores, nomes: criarResolvedor(usuarios, setores) };
}

/** Destino codificado como "setor:<id>" ou "usuario:<id>". */
export type DestinoValor = `setor:${string}` | `usuario:${string}`;

export function decodificarDestino(valor: DestinoValor) {
  const [tipo, id] = valor.split(":") as ["setor" | "usuario", string];
  return tipo === "setor"
    ? { destino_setor_id: id, destino_usuario_id: null }
    : { destino_usuario_id: id, destino_setor_id: null };
}

export type NovoTicket = {
  titulo: string;
  descricao: string;
  categoria: TicketCategoria;
  prioridade: TicketPrioridade;
  destino: DestinoValor;
  modulo_origem?: string | null;
};

/** O banco calcula prazo, responsável e grava o evento "criado". */
export async function criarTicket(dados: NovoTicket, autorId: string): Promise<Pick<Ticket, "id" | "numero">> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim() || null,
      categoria: dados.categoria,
      prioridade: dados.prioridade,
      modulo_origem: dados.modulo_origem ?? null,
      autor_id: autorId,
      ...decodificarDestino(dados.destino),
    })
    .select("id, numero")
    .single();
  falhar(error);
  return data as Pick<Ticket, "id" | "numero">;
}

/** Devolve o id do evento criado. Mensagem vazia é permitida quando a resposta tem só anexos. */
export async function enviarMensagem(ticketId: string, mensagem: string, interno: boolean, autorId: string) {
  const { data, error } = await supabase
    .from("ticket_eventos")
    .insert({
      ticket_id: ticketId,
      tipo: "mensagem",
      mensagem: mensagem.trim() || null,
      interno,
      autor_id: autorId,
    })
    .select("id")
    .single();
  falhar(error);
  return (data as { id: string }).id;
}
