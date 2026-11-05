import { supabase } from "@/lib/supabase";
import { DIAS_ENVIADAS, type DestinoEnvio } from "@/lib/checklistEnvios";
import { agruparPorLote, montarLoteBase, situacaoDoLote, type LoteDe, type SituacaoEnvio } from "@/lib/checklistLotes";
import type { ChecklistEnvioLista, ChecklistEnvioModo, ChecklistEnvioStatus } from "@/lib/types/shell";

// Toda escrita em checklist_envios_lista passa pelas RPCs; a tabela só aceita leitura de quem enviou ou recebeu.

const COLUNAS =
  "id, lote_id, grupo_id, nome, qtd_tarefas, de_usuario_id, para_usuario_id, setor_id, mensagem, status, modo, copia_grupo_id, resposta, reenvios, reenviado_em, respondido_em, ciente_em, criado_em";

/** Erro da RPC checklist_responder_envio_lista quando outra pessoa do lote aceitou antes. */
export const MSG_LISTA_JA_ACEITA = "Outra pessoa já aceitou esta lista";

export type LoteLista = LoteDe<ChecklistEnvioLista> & {
  grupoId: string | null;
  nome: string;
  qtdTarefas: number;
  modo: ChecklistEnvioModo;
};
export type SituacaoEnvioLista = SituacaoEnvio<LoteLista> | { tipo: "todos"; lote: LoteLista };

export type NovoEnvioLista = {
  grupoId: string;
  destino: DestinoEnvio;
  mensagem: string | null;
  modo: ChecklistEnvioModo;
};

/** Linha da RPC checklist_progresso_envio_lista_lote (só o remetente, modo "todos"). */
export type ProgressoEnvioListaLote = {
  envio_id: string;
  para_usuario_id: string;
  nome: string;
  status: ChecklistEnvioStatus;
  resposta: string | null;
  copia_total: number | null;
  copia_feitas: number | null;
  copia_recorrente: boolean | null;
};

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Envios aceitos em que o usuário é o destinatário (origem da lista, sem janela de dias). */
export async function listarListasAceitasRecebidas(usuarioId: string) {
  const { data, error } = await supabase
    .from("checklist_envios_lista")
    .select("grupo_id, copia_grupo_id, de_usuario_id, respondido_em")
    .eq("para_usuario_id", usuarioId)
    .eq("status", "aceito");
  falhar(error);
  return (data ?? []) as Array<{
    grupo_id: string | null;
    copia_grupo_id: string | null;
    de_usuario_id: string;
    respondido_em: string | null;
  }>;
}

export async function listarListasRecebidas(usuarioId: string): Promise<ChecklistEnvioLista[]> {
  const { data, error } = await supabase
    .from("checklist_envios_lista")
    .select(COLUNAS)
    .eq("para_usuario_id", usuarioId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false });
  falhar(error);
  return (data ?? []) as ChecklistEnvioLista[];
}

/** Mesma janela do envio de tarefa: 30 dias, mais pendentes e respostas sem "Ok", com os lotes completos. */
export async function listarListasEnviadas(usuarioId: string, agora = new Date()): Promise<ChecklistEnvioLista[]> {
  const limite = new Date(agora.getTime() - DIAS_ENVIADAS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("checklist_envios_lista")
    .select(COLUNAS)
    .eq("de_usuario_id", usuarioId)
    .or(`status.eq.pendente,and(status.in.(aceito,recusado),ciente_em.is.null),criado_em.gte.${limite}`);
  falhar(error);
  const linhas = (data ?? []) as ChecklistEnvioLista[];
  const lotes = [...new Set(linhas.map((e) => e.lote_id))];
  if (lotes.length === 0) return linhas;
  const resto = await supabase.from("checklist_envios_lista").select(COLUNAS).eq("de_usuario_id", usuarioId).in("lote_id", lotes);
  falhar(resto.error);
  const porId = new Map([...linhas, ...((resto.data ?? []) as ChecklistEnvioLista[])].map((e) => [e.id, e]));
  return [...porId.values()];
}

export async function listarLoteLista(loteId: string): Promise<ChecklistEnvioLista[]> {
  const { data, error } = await supabase.from("checklist_envios_lista").select(COLUNAS).eq("lote_id", loteId);
  falhar(error);
  return (data ?? []) as ChecklistEnvioLista[];
}

/** Títulos da lista recebida, só leitura (RPC: quem recebe não tem acesso às tarefas antes de aceitar). */
export async function listarTarefasDaListaRecebida(envioId: string): Promise<Array<{ id: string; titulo: string }>> {
  const { data, error } = await supabase.rpc("checklist_tarefas_envio_lista", { p_envio_id: envioId });
  falhar(error);
  return (data ?? []) as Array<{ id: string; titulo: string }>;
}

// ---------------------------------------------------------------------------
// RPCs
// ---------------------------------------------------------------------------

/** Devolve o lote_id. */
export async function enviarLista(e: NovoEnvioLista): Promise<string> {
  const { data, error } = await supabase.rpc("checklist_enviar_lista", {
    p_grupo_id: e.grupoId,
    p_para: e.destino.tipo === "pessoas" ? e.destino.ids : null,
    p_setor_id: e.destino.tipo === "setor" ? e.destino.setorId : null,
    p_mensagem: e.mensagem,
    p_modo: e.modo,
  });
  falhar(error);
  return data as string;
}

export async function listarProgressoLoteLista(loteId: string): Promise<ProgressoEnvioListaLote[]> {
  const { data, error } = await supabase.rpc("checklist_progresso_envio_lista_lote", { p_lote_id: loteId });
  falhar(error);
  return (data ?? []) as ProgressoEnvioListaLote[];
}

/** Recebidos de um envio para várias pessoas: lote_id -> quantas linhas o usuário consegue ver. */
export async function contarDestinatariosPorLoteLista(loteIds: string[]) {
  const contagem = new Map<string, number>();
  if (loteIds.length === 0) return contagem;
  const { data, error } = await supabase.from("checklist_envios_lista").select("lote_id").in("lote_id", loteIds);
  falhar(error);
  for (const l of data ?? []) contagem.set(l.lote_id as string, (contagem.get(l.lote_id as string) ?? 0) + 1);
  return contagem;
}

export async function responderEnvioLista(envioId: string, aceitar: boolean, resposta: string | null) {
  const { error } = await supabase.rpc("checklist_responder_envio_lista", {
    p_envio_id: envioId,
    p_aceitar: aceitar,
    p_resposta: resposta,
  });
  falhar(error);
}

async function rpcDoLote(nome: string, loteId: string) {
  const { error } = await supabase.rpc(nome, { p_lote_id: loteId });
  falhar(error);
  return listarLoteLista(loteId);
}

export const cancelarEnvioLista = (loteId: string) => rpcDoLote("checklist_cancelar_envio_lista", loteId);
export const reenviarEnvioLista = (loteId: string) => rpcDoLote("checklist_reenviar_envio_lista", loteId);
export const marcarCienteEnvioLista = (loteId: string) => rpcDoLote("checklist_ciente_envio_lista", loteId);

/** Duas assinaturas, como no envio de tarefa: para_usuario_id = eu e de_usuario_id = eu. */
export function assinarEnviosLista(usuarioId: string, ouvinte: (envio: ChecklistEnvioLista) => void) {
  const sufixo = `${usuarioId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const canais = (["para_usuario_id", "de_usuario_id"] as const).map((coluna) =>
    supabase
      .channel(`checklist-envios-lista-${coluna}-${sufixo}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "shell", table: "checklist_envios_lista", filter: `${coluna}=eq.${usuarioId}` },
        (payload: { eventType: string; new: unknown }) => {
          if (payload.eventType !== "DELETE") ouvinte(payload.new as ChecklistEnvioLista);
        },
      )
      .subscribe(),
  );
  return () => {
    canais.forEach((c) => supabase.removeChannel(c));
  };
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

function montarLoteLista(id: string, envios: ChecklistEnvioLista[]): LoteLista {
  const base = montarLoteBase(id, envios);
  const [primeiro] = base.envios;
  return {
    ...base,
    grupoId: primeiro.grupo_id,
    nome: primeiro.nome,
    qtdTarefas: primeiro.qtd_tarefas,
    modo: primeiro.modo ?? "primeiro",
  };
}

export function agruparLotesLista(envios: ChecklistEnvioLista[]): LoteLista[] {
  return agruparPorLote(envios, montarLoteLista);
}

/** Situação de cada lista pelo lote mais recente dela: aguardando, ou recusada por todos sem "Ok". */
export function situacaoPorLista(lotes: LoteLista[]) {
  const ultimo = new Map<string, LoteLista>();
  for (const l of lotes) {
    if (!l.grupoId) continue;
    const atual = ultimo.get(l.grupoId);
    if (!atual || l.criadoEm > atual.criadoEm) ultimo.set(l.grupoId, l);
  }
  const mapa = new Map<string, SituacaoEnvioLista>();
  for (const [grupoId, lote] of ultimo) {
    if (lote.modo === "todos") {
      if (!lote.envios.every((e) => e.status === "cancelado")) mapa.set(grupoId, { tipo: "todos", lote });
    } else {
      const s = situacaoDoLote(lote);
      if (s) mapa.set(grupoId, s);
    }
  }
  return mapa;
}
