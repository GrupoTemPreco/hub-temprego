import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { FILTRO_STATUS_ENCERRADOS } from "@/lib/tickets";
import type { Setor, Usuario } from "@/lib/types/shell";

export type SetorLista = Setor & { membros_ids: string[]; tickets_abertos: number };

export type UsuarioOpcao = Pick<Usuario, "id" | "nome" | "email" | "status">;

/** O setor tem tickets ou eventos ligados a ele e não pode ser apagado. */
export class SetorComHistoricoError extends Error {
  constructor() {
    super("O setor possui histórico de tickets e não pode ser excluído.");
  }
}

const FK_VIOLATION = "23503";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function contarPor<T>(linhas: T[], chave: (linha: T) => string | null) {
  const mapa = new Map<string, number>();
  for (const linha of linhas) {
    const id = chave(linha);
    if (id) mapa.set(id, (mapa.get(id) ?? 0) + 1);
  }
  return mapa;
}

export async function carregarSetoresAdmin(): Promise<{ setores: SetorLista[]; usuarios: UsuarioOpcao[] }> {
  const [setoresRes, vinculosRes, ticketsRes, usuariosRes] = await Promise.all([
    supabase.from("setores").select("*").order("nome", { ascending: true }),
    supabase.from("usuario_setores").select("usuario_id, setor_id"),
    supabase
      .from("tickets")
      .select("destino_setor_id")
      .not("status", "in", FILTRO_STATUS_ENCERRADOS)
      .is("excluido_em", null)
      .not("destino_setor_id", "is", null),
    supabase.from("usuarios").select("id, nome, email, status").order("nome", { ascending: true }),
  ]);
  falhar(setoresRes.error);
  falhar(vinculosRes.error);
  falhar(ticketsRes.error);
  falhar(usuariosRes.error);

  const vinculos = vinculosRes.data ?? [];
  const ticketsPorSetor = contarPor(ticketsRes.data ?? [], (t) => t.destino_setor_id);

  const setores = ((setoresRes.data ?? []) as Setor[]).map((s) => ({
    ...s,
    membros_ids: vinculos.filter((v) => v.setor_id === s.id).map((v) => v.usuario_id),
    tickets_abertos: ticketsPorSetor.get(s.id) ?? 0,
  }));

  return { setores, usuarios: (usuariosRes.data ?? []) as UsuarioOpcao[] };
}

export async function alterarAtivoSetor(setor: Pick<Setor, "id" | "nome">, ativo: boolean) {
  const { error } = await supabase.from("setores").update({ ativo }).eq("id", setor.id);
  falhar(error);

  await registrarAcao({
    acao: ativo ? "ativar_setor" : "desativar_setor",
    alvo_tipo: "setor",
    alvo_id: setor.id,
    descricao: `${ativo ? "ativou" : "desativou"} o setor ${setor.nome}`,
  });
}

export async function setorTemHistorico(setorId: string): Promise<boolean> {
  const [ticketsRes, eventosRes] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("destino_setor_id", setorId),
    supabase
      .from("ticket_eventos")
      .select("id", { count: "exact", head: true })
      .or(`de_setor_id.eq.${setorId},para_setor_id.eq.${setorId}`),
  ]);
  falhar(ticketsRes.error);
  falhar(eventosRes.error);
  return (ticketsRes.count ?? 0) > 0 || (eventosRes.count ?? 0) > 0;
}

export async function excluirSetor(setor: Pick<Setor, "id" | "nome">) {
  const { error } = await supabase.from("setores").delete().eq("id", setor.id);
  if (error?.code === FK_VIOLATION) throw new SetorComHistoricoError();
  falhar(error);

  await registrarAcao({
    acao: "excluir_setor",
    alvo_tipo: "setor",
    alvo_id: setor.id,
    descricao: `excluiu o setor ${setor.nome}`,
  });
}
