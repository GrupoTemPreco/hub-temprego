import { supabase } from "@/lib/supabase";
import { hojeSP } from "@/lib/checklistRegras";
import type { ChecklistItem } from "@/lib/types/shell";

type CamposGravacao = Partial<
  Pick<ChecklistItem, "grupo_id" | "titulo" | "observacao" | "nivel" | "urgencia" | "prazo" | "status" | "fixado" | "ordem" | "diaria">
>;

export const ROTULO_DIARIA = "Tarefa diária (repete todo dia)";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Ids das tarefas com conclusão na data de hoje em São Paulo. Uma consulta para todas. */
export async function listarConclusoesDeHoje(hoje = hojeSP()) {
  const { data, error } = await supabase.from("checklist_tarefa_conclusoes").select("tarefa_id").eq("data", hoje);
  falhar(error);
  return (data ?? []).map((linha) => linha.tarefa_id as string);
}

/** Insere a conclusão de hoje. Conflito (clique duplo) não altera a linha que já existe. */
export async function marcarConclusaoDeHoje(tarefaId: string, usuarioId: string, hoje = hojeSP()) {
  await marcarConclusoesDeHoje([tarefaId], usuarioId, hoje);
}

/** Várias conclusões de hoje de uma vez. Linha que já existe fica como está. */
export async function marcarConclusoesDeHoje(tarefaIds: string[], usuarioId: string, hoje = hojeSP()) {
  if (tarefaIds.length === 0) return;
  const { error } = await supabase.from("checklist_tarefa_conclusoes").upsert(
    tarefaIds.map((tarefa_id) => ({ tarefa_id, data: hoje, usuario_id: usuarioId })),
    { onConflict: "tarefa_id,data", ignoreDuplicates: true },
  );
  falhar(error);
}

/** Tarefas concluídas hoje em São Paulo: status feito e concluido_em nesta data. */
export function idsConcluidasHoje(itens: ChecklistItem[], hoje = hojeSP()) {
  return itens
    .filter((item) => item.status === "feito" && item.concluido_em != null && hojeSP(new Date(item.concluido_em)) === hoje)
    .map((item) => item.id);
}

export async function desmarcarConclusaoDeHoje(tarefaId: string, hoje = hojeSP()) {
  const { error } = await supabase
    .from("checklist_tarefa_conclusoes")
    .delete()
    .eq("tarefa_id", tarefaId)
    .eq("data", hoje);
  falhar(error);
}

/**
 * Na diária, o status exibido é o de hoje: feita se houver conclusão nesta data.
 * O status gravado na tarefa não entra nessa conta.
 */
export function comStatusDoDia(item: ChecklistItem, feitasHoje: ReadonlySet<string>): ChecklistItem {
  if (!item.diaria) return item;
  return { ...item, status: feitasHoje.has(item.id) ? "feito" : "a_fazer" };
}

/**
 * Diária não grava o status normal. Ao desligar, vira tarefa comum: concluída se já foi feita
 * hoje, senão pendente. As linhas de conclusão não são apagadas.
 */
export function camposParaGravar(antes: ChecklistItem, campos: CamposGravacao, feitaHoje: boolean): CamposGravacao {
  if (!antes.diaria) return campos;
  if (campos.diaria === false) return { ...campos, status: feitaHoje ? "feito" : "a_fazer" };
  if (!("status" in campos)) return campos;
  const { status: _status, ...resto } = campos;
  return resto;
}

/** Entrar numa lista diária liga a tarefa. Sair de uma lista diária para uma normal desliga, com a regra do dia. */
export function diariaAoMudarDeLista(
  antes: ChecklistItem,
  campos: CamposGravacao,
  origemDiaria: boolean,
  destinoDiaria: boolean,
  feitaHoje: boolean,
): CamposGravacao {
  if (!campos.grupo_id || campos.grupo_id === antes.grupo_id) return campos;
  if (destinoDiaria) {
    const { status: _status, ...resto } = campos;
    return { ...resto, diaria: true };
  }
  // Arrastar não manda `diaria`. O drawer manda true só quando a pessoa religa o interruptor.
  if (origemDiaria && campos.diaria !== true) return { ...campos, diaria: false, status: feitaHoje ? "feito" : "a_fazer" };
  return campos;
}

/** Liga a diária em todas as tarefas do grupo. O status gravado não muda. */
export async function ligarItensDaLista(grupoId: string) {
  const { error } = await supabase.from("checklist_itens").update({ diaria: true }).eq("grupo_id", grupoId);
  falhar(error);
}

/**
 * Desliga a diária de todas as tarefas do grupo. Quem foi concluída hoje fica feita;
 * as outras ficam pendentes. O histórico de conclusões não é apagado.
 */
export async function desligarItensDaLista(grupoId: string, feitasHoje: string[]) {
  const pendentes = await supabase
    .from("checklist_itens")
    .update({ diaria: false, status: "a_fazer" })
    .eq("grupo_id", grupoId);
  falhar(pendentes.error);
  if (feitasHoje.length === 0) return;
  const feitas = await supabase
    .from("checklist_itens")
    .update({ diaria: false, status: "feito" })
    .eq("grupo_id", grupoId)
    .in("id", feitasHoje);
  falhar(feitas.error);
}
