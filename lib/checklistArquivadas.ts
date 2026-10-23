import { supabase } from "@/lib/supabase";
import { COLUNAS_GRUPO, listarItens } from "@/lib/checklist";
import { listarMembros } from "@/lib/checklistMembros";
import type { ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";

export const MSG_EXCLUSAO_COM_ENVIO = "Cancele os envios pendentes antes de excluir esta lista";

export type CargaArquivadas = { listas: ChecklistGrupo[]; itens: ChecklistItem[]; membros: ChecklistMembro[] };

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Listas arquivadas em que o usuário é dono, das mais recentes para as mais antigas, com itens e membros. */
export async function carregarArquivadas(donoId: string): Promise<CargaArquivadas> {
  const { data, error } = await supabase
    .from("checklist_grupos")
    .select(COLUNAS_GRUPO)
    .eq("dono_id", donoId)
    .eq("arquivado", true)
    .order("arquivado_em", { ascending: false, nullsFirst: false });
  falhar(error);
  const listas = (data ?? []) as ChecklistGrupo[];
  const ids = listas.map((l) => l.id);
  const [itens, membros] = await Promise.all([listarItens(ids), listarMembros(ids)]);
  return { listas, itens, membros };
}

/** Algum dos itens tem envio aguardando resposta? (bloqueia a exclusão definitiva) */
export async function temEnvioPendente(itemIds: string[]) {
  if (itemIds.length === 0) return false;
  const { count, error } = await supabase
    .from("checklist_envios")
    .select("id", { count: "exact", head: true })
    .in("item_id", itemIds)
    .eq("status", "pendente");
  falhar(error);
  return (count ?? 0) > 0;
}

/** Apaga os itens, os membros e a lista. Envios antigos dos itens ficam, com item_id nulo. */
export async function excluirListaDefinitivamente(grupoId: string) {
  const itens = await supabase.from("checklist_itens").delete().eq("grupo_id", grupoId);
  falhar(itens.error);
  const membros = await supabase.from("checklist_grupo_membros").delete().eq("grupo_id", grupoId);
  falhar(membros.error);
  const lista = await supabase.from("checklist_grupos").delete().eq("id", grupoId);
  falhar(lista.error);
}
