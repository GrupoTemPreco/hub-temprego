import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { listarMembros, listarParticipacoes } from "@/lib/checklistMembros";
import type { ChecklistCor, ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";

export const COLUNAS_GRUPO = "id, dono_id, nome, cor, ordem, arquivado, arquivado_em, criado_em";
const COLUNAS_ITEM =
  "id, grupo_id, criado_por, titulo, observacao, nivel, urgencia, prazo, status, fixado, ordem, concluido_em, criado_em, atualizado_em";

export const NOME_GRUPO_INICIAL = "Minhas tarefas";
export const COR_GRUPO_PADRAO: ChecklistCor = "azul";

export type CamposGrupo = Partial<Pick<ChecklistGrupo, "nome" | "cor" | "ordem" | "arquivado" | "arquivado_em">>;

/** atualizado_em e concluido_em ficam fora: quem preenche é o trigger do banco. */
export type CamposItem = Partial<
  Pick<
    ChecklistItem,
    "grupo_id" | "titulo" | "observacao" | "nivel" | "urgencia" | "prazo" | "status" | "fixado" | "ordem"
  >
>;

export type NovoItem = Pick<ChecklistItem, "grupo_id" | "titulo" | "nivel" | "urgencia" | "ordem" | "criado_por"> &
  Partial<Pick<ChecklistItem, "observacao">>;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listarGrupos(donoId: string): Promise<ChecklistGrupo[]> {
  const { data, error } = await supabase
    .from("checklist_grupos")
    .select(COLUNAS_GRUPO)
    .eq("dono_id", donoId)
    .eq("arquivado", false)
    .order("ordem", { ascending: true });
  falhar(error);
  return (data ?? []) as ChecklistGrupo[];
}

/** Grupos ativos pelo id (ex.: os compartilhados com o usuário). */
export async function listarGruposPorIds(ids: string[]): Promise<ChecklistGrupo[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("checklist_grupos")
    .select(COLUNAS_GRUPO)
    .in("id", ids)
    .eq("arquivado", false);
  falhar(error);
  return (data ?? []) as ChecklistGrupo[];
}

export async function criarGrupo(dados: Pick<ChecklistGrupo, "dono_id" | "nome" | "cor" | "ordem">) {
  const { data, error } = await supabase.from("checklist_grupos").insert(dados).select(COLUNAS_GRUPO).single();
  falhar(error);
  return data as ChecklistGrupo;
}

export async function atualizarGrupo(id: string, campos: CamposGrupo) {
  const { error } = await supabase.from("checklist_grupos").update(campos).eq("id", id);
  falhar(error);
}

export async function listarItens(grupoIds: string[]): Promise<ChecklistItem[]> {
  if (grupoIds.length === 0) return [];
  const { data, error } = await supabase
    .from("checklist_itens")
    .select(COLUNAS_ITEM)
    .in("grupo_id", grupoIds)
    .order("ordem", { ascending: true });
  falhar(error);
  return (data ?? []) as ChecklistItem[];
}

/** Itens pelo id; os que não existem (ou que o usuário não pode ver) simplesmente não voltam. */
export async function buscarItens(ids: string[]): Promise<ChecklistItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("checklist_itens").select(COLUNAS_ITEM).in("id", ids);
  falhar(error);
  return (data ?? []) as ChecklistItem[];
}

export async function criarItem(dados: NovoItem) {
  const { data, error } = await supabase
    .from("checklist_itens")
    .insert({ ...dados, status: "a_fazer" })
    .select(COLUNAS_ITEM)
    .single();
  falhar(error);
  return data as ChecklistItem;
}

export async function atualizarItem(id: string, campos: CamposItem) {
  const { error } = await supabase.from("checklist_itens").update(campos).eq("id", id);
  falhar(error);
}

export async function excluirItem(id: string) {
  const { error } = await supabase.from("checklist_itens").delete().eq("id", id);
  falhar(error);
}

export function criarGrupoInicial(donoId: string, ordem = 1) {
  return criarGrupo({ dono_id: donoId, nome: NOME_GRUPO_INICIAL, cor: COR_GRUPO_PADRAO, ordem });
}

async function buscarOuCriarGrupos(donoId: string) {
  const grupos = await listarGrupos(donoId);
  if (grupos.length > 0) return grupos;
  return [await criarGrupoInicial(donoId)];
}

export type CargaChecklist = { grupos: ChecklistGrupo[]; itens: ChecklistItem[]; membros: ChecklistMembro[] };

// Evita criar "Minhas tarefas" duas vezes quando a página monta duas vezes seguidas (StrictMode).
const carregamentos = new Map<string, Promise<CargaChecklist>>();

/**
 * Grupos ativos do usuário (próprios e compartilhados com ele), os itens e os membros deles.
 * Com `criarInicial`, sem nenhum grupo próprio, cria "Minhas tarefas".
 */
export function carregarChecklist(donoId: string, criarInicial = true) {
  const chave = `${donoId}:${criarInicial}`;
  const emAndamento = carregamentos.get(chave);
  if (emAndamento) return emAndamento;

  const promessa = (async () => {
    const [proprios, participacoes] = await Promise.all([
      criarInicial ? buscarOuCriarGrupos(donoId) : listarGrupos(donoId),
      listarParticipacoes(donoId),
    ]);
    const compartilhados = await listarGruposPorIds(
      participacoes.map((p) => p.grupo_id).filter((id) => !proprios.some((g) => g.id === id)),
    );
    const grupos = [...proprios, ...compartilhados];
    const ids = grupos.map((g) => g.id);
    const [itens, membrosDasListas] = await Promise.all([listarItens(ids), listarMembros(ids)]);
    // Participações em listas arquivadas ficam guardadas: quando o dono restaurar, o tempo real
    // reconhece o usuário como membro e a lista volta para ele.
    const membros = [...membrosDasListas, ...participacoes.filter((p) => !ids.includes(p.grupo_id))];
    return { grupos, itens, membros };
  })().finally(() => carregamentos.delete(chave));

  carregamentos.set(chave, promessa);
  return promessa;
}

export type TipoMudanca = "INSERT" | "UPDATE" | "DELETE";

export type OuvintesChecklist = {
  grupo: (tipo: TipoMudanca, novo: ChecklistGrupo | null, antigoId: string | null) => void;
  item: (tipo: TipoMudanca, novo: ChecklistItem | null, antigoId: string | null) => void;
};

function extrair<T>(payload: RealtimePostgresChangesPayload<Record<string, unknown>>) {
  const novo = payload.eventType === "DELETE" ? null : (payload.new as T);
  const antigoId = (payload.old as { id?: string } | null)?.id ?? null;
  return { novo, antigoId };
}

/**
 * Assina checklist_grupos e checklist_itens, sem filtro no servidor: chegam os grupos próprios e os
 * compartilhados (o RLS limita ao que o usuário vê), e quem chama filtra pelos grupos que conhece.
 */
export function assinarChecklist(donoId: string, ouvintes: OuvintesChecklist) {
  const canal = supabase
    .channel(`checklist-${donoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "*", schema: "shell", table: "checklist_grupos" }, (payload) => {
      const { novo, antigoId } = extrair<ChecklistGrupo>(payload);
      ouvintes.grupo(payload.eventType, novo, antigoId);
    })
    .on("postgres_changes", { event: "*", schema: "shell", table: "checklist_itens" }, (payload) => {
      const { novo, antigoId } = extrair<ChecklistItem>(payload);
      ouvintes.item(payload.eventType, novo, antigoId);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
