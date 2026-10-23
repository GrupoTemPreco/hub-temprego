import { supabase } from "@/lib/supabase";
import type { LoteEnvio } from "@/lib/checklistLotes";
import type { ChecklistEnvio, Usuario } from "@/lib/types/shell";

const COLUNAS_ENVIO =
  "id, lote_id, setor_id, item_id, titulo, de_usuario_id, para_usuario_id, mensagem, prazo_sugerido, status, resposta, prazo_resposta, reenvios, reenviado_em, respondido_em, ciente_em, criado_em";

export const MSG_ENVIO_DUPLICADO = "Essa tarefa já tem um envio pendente.";
/** Erro da RPC checklist_responder_envio quando outra pessoa do lote aceitou antes. */
export const MSG_JA_ACEITA = "Outra pessoa já aceitou esta tarefa";
export const MINUTOS_ENTRE_ENVIOS = 30;
export const DIAS_ENVIADAS = 30;
const CODIGO_UNICO_VIOLADO = "23505";

export type PessoaChecklist = Pick<Usuario, "id" | "nome" | "email" | "status" | "acesso_checklist">;

/** Setor ativo com quem receberia um envio para ele (aprovados com acesso ao checklist, sem quem envia). */
export type SetorChecklist = { id: string; nome: string; destinatarios: string[] };

/** Pessoas (uma ou várias) ou um setor; a RPC expande o setor nos membros. */
export type DestinoEnvio = { tipo: "pessoas"; ids: string[] } | { tipo: "setor"; setorId: string };

export type NovoEnvio = {
  itemId: string;
  destino: DestinoEnvio;
  mensagem: string | null;
  prazoSugerido: string | null;
};

function falhar(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === CODIGO_UNICO_VIOLADO) throw new Error(MSG_ENVIO_DUPLICADO);
  throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export async function listarPessoas(): Promise<PessoaChecklist[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, status, acesso_checklist")
    .order("nome", { ascending: true });
  falhar(error);
  return (data ?? []) as PessoaChecklist[];
}

/** Setores ativos e os membros de cada um (ids), para o modo "Setor" do envio. */
export async function listarSetoresComMembros() {
  const [setoresRes, vinculosRes] = await Promise.all([
    supabase.from("setores").select("id, nome").eq("ativo", true).order("nome", { ascending: true }),
    supabase.from("usuario_setores").select("usuario_id, setor_id"),
  ]);
  falhar(setoresRes.error);
  falhar(vinculosRes.error);
  const membros = new Map<string, string[]>();
  for (const v of vinculosRes.data ?? []) {
    membros.set(v.setor_id as string, [...(membros.get(v.setor_id as string) ?? []), v.usuario_id as string]);
  }
  return (setoresRes.data ?? []).map((s) => ({ id: s.id as string, nome: s.nome as string, membros: membros.get(s.id) ?? [] }));
}

export async function listarRecebidosPendentes(usuarioId: string): Promise<ChecklistEnvio[]> {
  const { data, error } = await supabase
    .from("checklist_envios")
    .select(COLUNAS_ENVIO)
    .eq("para_usuario_id", usuarioId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false });
  falhar(error);
  return (data ?? []) as ChecklistEnvio[];
}

/**
 * Últimos 30 dias, mais os que ainda pedem atenção (pendentes e respostas sem "Ok"),
 * completando cada lote com todas as linhas dele (inclusive as "encerrado").
 */
export async function listarEnviados(usuarioId: string, agora = new Date()): Promise<ChecklistEnvio[]> {
  const limite = new Date(agora.getTime() - DIAS_ENVIADAS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("checklist_envios")
    .select(COLUNAS_ENVIO)
    .eq("de_usuario_id", usuarioId)
    .or(`status.eq.pendente,and(status.in.(aceito,recusado),ciente_em.is.null),criado_em.gte.${limite}`);
  falhar(error);
  const linhas = (data ?? []) as ChecklistEnvio[];
  const lotes = [...new Set(linhas.map((e) => e.lote_id).filter((id): id is string => Boolean(id)))];
  if (lotes.length === 0) return linhas;

  const resto = await supabase.from("checklist_envios").select(COLUNAS_ENVIO).eq("de_usuario_id", usuarioId).in("lote_id", lotes);
  falhar(resto.error);
  const porId = new Map([...linhas, ...((resto.data ?? []) as ChecklistEnvio[])].map((e) => [e.id, e]));
  return [...porId.values()];
}

/** Todas as linhas de um lote (ex.: logo depois de enviar). */
export async function listarLote(loteId: string): Promise<ChecklistEnvio[]> {
  const { data, error } = await supabase.from("checklist_envios").select(COLUNAS_ENVIO).eq("lote_id", loteId);
  falhar(error);
  return (data ?? []) as ChecklistEnvio[];
}

/** Recebidos que fazem parte de um envio para várias pessoas: lote_id -> quantas linhas o usuário consegue ver. */
export async function contarDestinatariosPorLote(loteIds: string[]) {
  const contagem = new Map<string, number>();
  if (loteIds.length === 0) return contagem;
  const { data, error } = await supabase.from("checklist_envios").select("lote_id").in("lote_id", loteIds);
  falhar(error);
  for (const l of data ?? []) contagem.set(l.lote_id as string, (contagem.get(l.lote_id as string) ?? 0) + 1);
  return contagem;
}

/**
 * Todo envio passa pela RPC: ela valida a permissão, impede um segundo lote pendente para o item
 * e expande o setor. Devolve o lote_id.
 */
export async function enviarTarefa(e: NovoEnvio): Promise<string> {
  const { data, error } = await supabase.rpc("checklist_enviar", {
    p_item_id: e.itemId,
    p_para: e.destino.tipo === "pessoas" ? e.destino.ids : null,
    p_setor_id: e.destino.tipo === "setor" ? e.destino.setorId : null,
    p_mensagem: e.mensagem,
    p_prazo: e.prazoSugerido,
  });
  falhar(error);
  return data as string;
}

/** Atualiza linhas pelo id (as do lote em questão) e devolve como ficaram. */
async function atualizarLinhas(ids: string[], campos: Partial<ChecklistEnvio>) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("checklist_envios").update(campos).in("id", ids).select(COLUNAS_ENVIO);
  falhar(error);
  return (data ?? []) as ChecklistEnvio[];
}

/** Reenvio vale para o lote inteiro: todos os pendentes. */
export function reenviarLote(lote: LoteEnvio) {
  return atualizarLinhas(
    lote.pendentes.map((e) => e.id),
    { reenvios: lote.reenvios + 1, reenviado_em: new Date().toISOString() },
  );
}

export function cancelarLote(lote: LoteEnvio) {
  return atualizarLinhas(
    lote.pendentes.map((e) => e.id),
    { status: "cancelado" },
  );
}

/** "Ok" de quem enviou: ciente_em em todas as linhas do lote. */
export function marcarCienteLote(lote: Pick<LoteEnvio, "envios">) {
  return atualizarLinhas(
    lote.envios.map((e) => e.id),
    { ciente_em: new Date().toISOString() },
  );
}

export type RespostaEnvio = {
  envioId: string;
  aceitar: boolean;
  grupoId: string | null;
  prazo: string | null;
  resposta: string | null;
};

/**
 * Aceitar move o item para a lista de quem recebe e encerra os outros pendentes do lote;
 * isso só acontece no banco, pela RPC.
 */
export async function responderEnvio(r: RespostaEnvio) {
  const { error } = await supabase.rpc("checklist_responder_envio", {
    p_envio_id: r.envioId,
    p_aceitar: r.aceitar,
    p_grupo_id: r.grupoId,
    p_prazo: r.prazo,
    p_resposta: r.resposta,
  });
  falhar(error);
}

/**
 * Envios em que o usuário é destinatário ou remetente. O Realtime aceita um filtro por assinatura,
 * então são duas, cada uma no seu canal: para_usuario_id = eu e de_usuario_id = eu.
 */
export function assinarEnvios(usuarioId: string, ouvinte: (envio: ChecklistEnvio) => void) {
  const repassar = (payload: { eventType: string; new: unknown }) => {
    if (payload.eventType !== "DELETE") ouvinte(payload.new as ChecklistEnvio);
  };
  const sufixo = `${usuarioId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const canais = (["para_usuario_id", "de_usuario_id"] as const).map((coluna) =>
    supabase
      .channel(`checklist-envios-${coluna}-${sufixo}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "shell", table: "checklist_envios", filter: `${coluna}=eq.${usuarioId}` },
        repassar,
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

export function podeReceber(pessoa: PessoaChecklist, meuId: string) {
  return pessoa.id !== meuId && pessoa.status === "aprovado" && Boolean(pessoa.acesso_checklist);
}

/** Último envio ou reenvio. */
export function ultimoEnvioEm(envio: Pick<ChecklistEnvio, "criado_em" | "reenviado_em">) {
  return envio.reenviado_em ?? envio.criado_em;
}

/** Minutos que faltam para poder reenviar o lote; 0 quando já pode. */
export function minutosParaReenviar(lote: Pick<LoteEnvio, "ultimoEnvioEm">, agora = Date.now()) {
  const liberaEm = new Date(lote.ultimoEnvioEm).getTime() + MINUTOS_ENTRE_ENVIOS * 60_000;
  return Math.max(0, Math.ceil((liberaEm - agora) / 60_000));
}
