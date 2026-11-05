import { supabase } from "@/lib/supabase";
import { hojeSP } from "@/lib/checklistRegras";
import type { ChecklistItem } from "@/lib/types/shell";

type CamposGravacao = Partial<
  Pick<
    ChecklistItem,
    "grupo_id" | "titulo" | "observacao" | "nivel" | "urgencia" | "prazo" | "status" | "fixado" | "ordem" | "diaria" | "dias_semana"
  >
>;

type Recorrencia = Pick<ChecklistItem, "diaria" | "dias_semana" | "criado_em">;

/** 0 = domingo ... 6 = sábado, como em shell.checklist_itens.dias_semana. */
export const DIAS_SEMANA = [
  { valor: 0, letra: "D", curto: "Dom", nome: "Domingo", selo: "domingo" },
  { valor: 1, letra: "S", curto: "Seg", nome: "Segunda-feira", selo: "segunda" },
  { valor: 2, letra: "T", curto: "Ter", nome: "Terça-feira", selo: "terça" },
  { valor: 3, letra: "Q", curto: "Qua", nome: "Quarta-feira", selo: "quarta" },
  { valor: 4, letra: "Q", curto: "Qui", nome: "Quinta-feira", selo: "quinta" },
  { valor: 5, letra: "S", curto: "Sex", nome: "Sexta-feira", selo: "sexta" },
  { valor: 6, letra: "S", curto: "Sáb", nome: "Sábado", selo: "sábado" },
] as const;

/** Segunda primeiro, domingo no fim (ordem dos selos). */
const ORDEM_SELO = [1, 2, 3, 4, 5, 6, 0];
const DIAS_UTEIS = [1, 2, 3, 4, 5];
/** Conclusões carregadas: a ocorrência atual de qualquer recorrência cai nesta janela. */
export const JANELA_CONCLUSOES = 7;
const DIA_MS = 86_400_000;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Datas (YYYY-MM-DD, sem fuso)
// ---------------------------------------------------------------------------

function paraUtc(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function somarDias(data: string, dias: number) {
  return new Date(paraUtc(data) + dias * DIA_MS).toISOString().slice(0, 10);
}

export function diaDaSemana(data: string) {
  return new Date(paraUtc(data)).getUTCDay();
}

const diaCurto = (data: string) => DIAS_SEMANA[diaDaSemana(data)].curto.toLowerCase();

function diaMes(data: string) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

// ---------------------------------------------------------------------------
// Dias programados e ocorrências
// ---------------------------------------------------------------------------

/** Ordena e tira repetidos. Os 7 dias (ou nenhum) viram null, que é "todo dia". */
export function normalizarDias(dias: readonly number[] | null | undefined): number[] | null {
  if (!dias) return null;
  const unicos = [...new Set(dias.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  return unicos.length === 0 || unicos.length === DIAS_SEMANA.length ? null : unicos;
}

export function mesmosDias(a: readonly number[] | null | undefined, b: readonly number[] | null | undefined) {
  const x = normalizarDias(a);
  const y = normalizarDias(b);
  if (!x || !y) return x === y;
  return x.length === y.length && x.every((d, i) => d === y[i]);
}

/** Recorrente só em alguns dias da semana (não "todo dia"). */
export function temDiasEspecificos(item: Pick<ChecklistItem, "diaria" | "dias_semana">) {
  return item.diaria && normalizarDias(item.dias_semana) !== null;
}

function programado(dias: number[] | null, data: string) {
  return !dias || dias.includes(diaDaSemana(data));
}

/**
 * Dia programado mais recente que seja <= hoje. Antes da criação da tarefa não conta:
 * nesse caso ainda não há ocorrência (null). Para "todo dia" é sempre hoje.
 */
export function ocorrenciaAtual(item: Recorrencia, hoje = hojeSP()): string | null {
  if (!item.diaria) return null;
  const dias = normalizarDias(item.dias_semana);
  const criada = hojeSP(new Date(item.criado_em));
  for (let k = 0; k < DIAS_SEMANA.length; k++) {
    const data = somarDias(hoje, -k);
    if (programado(dias, data)) return data >= criada ? data : null;
  }
  return null;
}

/** Primeiro dia programado depois de hoje. */
export function proximaOcorrencia(item: Pick<ChecklistItem, "dias_semana">, hoje = hojeSP()) {
  const dias = normalizarDias(item.dias_semana);
  for (let k = 1; k <= DIAS_SEMANA.length; k++) {
    const data = somarDias(hoje, k);
    if (programado(dias, data)) return data;
  }
  return somarDias(hoje, 1);
}

export type SituacaoRecorrencia =
  | { tipo: "pendente"; ocorrencia: string; atrasada: boolean }
  | { tipo: "feita"; ocorrencia: string; proxima: string }
  | { tipo: "sem_ocorrencia"; proxima: string };

/** Para itens já com o status do dia (comStatusDoDia). Null quando não repete. */
export function situacaoRecorrencia(item: ChecklistItem, hoje = hojeSP()): SituacaoRecorrencia | null {
  if (!item.diaria) return null;
  const ocorrencia = ocorrenciaAtual(item, hoje);
  if (!ocorrencia) return { tipo: "sem_ocorrencia", proxima: proximaOcorrencia(item, hoje) };
  if (item.status === "feito") return { tipo: "feita", ocorrencia, proxima: proximaOcorrencia(item, hoje) };
  return { tipo: "pendente", ocorrencia, atrasada: ocorrencia < hoje };
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

/** "Diária", "Toda quarta", "Dias úteis" ou "Seg, Qua, Sex". */
export function rotuloDias(diasSemana: readonly number[] | null | undefined) {
  const dias = normalizarDias(diasSemana);
  if (!dias) return "Diária";
  if (mesmosDias(dias, DIAS_UTEIS)) return "Dias úteis";
  if (dias.length === 1) {
    const dia = DIAS_SEMANA[dias[0]];
    return `${dia.valor === 0 || dia.valor === 6 ? "Todo" : "Toda"} ${dia.selo}`;
  }
  return ORDEM_SELO.filter((d) => dias.includes(d))
    .map((d) => DIAS_SEMANA[d].curto)
    .join(", ");
}

/** Repetição de uma lista (checklist_grupos.diaria e dias_semana). */
export type RepeticaoLista = { diaria: boolean; dias_semana?: readonly number[] | null };

/** A lista já mostra o selo: a tarefa só mostra o próprio quando repete em dias diferentes dos dela. */
export function mostraSeloProprio(item: Pick<ChecklistItem, "diaria" | "dias_semana">, lista?: RepeticaoLista | null) {
  if (!item.diaria) return false;
  if (!lista?.diaria) return true;
  return !mesmosDias(item.dias_semana, lista.dias_semana);
}

/** Campos que as tarefas recebem de uma lista que repete. */
export function camposDaLista(lista: RepeticaoLista): Pick<ChecklistItem, "diaria" | "dias_semana"> {
  return { diaria: true, dias_semana: normalizarDias(lista.dias_semana) };
}

export function descricaoRecorrencia(item: Pick<ChecklistItem, "diaria" | "dias_semana">) {
  if (!item.diaria) return "Não repete";
  return rotuloDias(item.dias_semana);
}

export const textoAtrasada = (ocorrencia: string) => `Atrasada · era ${diaCurto(ocorrencia)}`;
export const textoProxima = (data: string) => `Próxima: ${diaCurto(data)}, ${diaMes(data)}`;
export const textoEra = (ocorrencia: string) => `Era ${diaCurto(ocorrencia)}, ${diaMes(ocorrencia)}`;

// ---------------------------------------------------------------------------
// Conclusões (checklist_tarefa_conclusoes)
// ---------------------------------------------------------------------------

/** Chave `tarefa|data` -> concluida_em (momento real da marcação). */
export type Conclusoes = ReadonlyMap<string, string | null>;
export type LinhaConclusao = { tarefaId: string; data: string };

export const chaveConclusao = (tarefaId: string, data: string) => `${tarefaId}|${data}`;

/** Conclusões dos últimos 7 dias (São Paulo). Uma consulta para todas as tarefas. */
export async function listarConclusoesRecentes(hoje = hojeSP()): Promise<Map<string, string | null>> {
  const { data, error } = await supabase
    .from("checklist_tarefa_conclusoes")
    .select("tarefa_id, data, concluida_em")
    .gte("data", somarDias(hoje, -(JANELA_CONCLUSOES - 1)))
    .lte("data", hoje);
  falhar(error);
  return new Map(
    (data ?? []).map((linha) => [
      chaveConclusao(linha.tarefa_id as string, linha.data as string),
      (linha.concluida_em as string | null) ?? null,
    ]),
  );
}

/** Insere as conclusões. Conflito (clique duplo) não altera a linha que já existe. */
export async function marcarConclusoes(linhas: LinhaConclusao[], usuarioId: string) {
  if (linhas.length === 0) return;
  const { error } = await supabase.from("checklist_tarefa_conclusoes").upsert(
    linhas.map((l) => ({ tarefa_id: l.tarefaId, data: l.data, usuario_id: usuarioId })),
    { onConflict: "tarefa_id,data", ignoreDuplicates: true },
  );
  falhar(error);
}

export async function desmarcarConclusao(tarefaId: string, data: string) {
  const { error } = await supabase.from("checklist_tarefa_conclusoes").delete().eq("tarefa_id", tarefaId).eq("data", data);
  falhar(error);
}

/** Feita = existe conclusão na data da ocorrência atual. */
export function feitaNaOcorrencia(item: ChecklistItem, conclusoes: Conclusoes, hoje = hojeSP()) {
  const ocorrencia = ocorrenciaAtual(item, hoje);
  return ocorrencia !== null && conclusoes.has(chaveConclusao(item.id, ocorrencia));
}

const ehHoje = (iso: string | null | undefined, hoje: string) => Boolean(iso) && hojeSP(new Date(iso!)) === hoje;

/** Concluída hoje: status gravado 'feito' com concluido_em hoje, ou conclusão marcada hoje. */
export function concluidaHoje(item: ChecklistItem, conclusoes: Conclusoes, hoje = hojeSP()) {
  if (item.status === "feito" && ehHoje(item.concluido_em, hoje)) return true;
  const prefixo = `${item.id}|`;
  for (const [chave, em] of conclusoes) if (chave.startsWith(prefixo) && ehHoje(em, hoje)) return true;
  return false;
}

/** Feitas na tela, mas não hoje: ao ligar a lista, voltam pendentes na próxima ocorrência. */
export function qtdConcluidasAntesDeHoje(itens: readonly ChecklistItem[], conclusoes: Conclusoes, hoje = hojeSP()) {
  return itens.filter((i) => i.status === "feito" && !concluidaHoje(i, conclusoes, hoje)).length;
}

/**
 * Ao ligar a recorrência ou mudar os dias de quem foi concluída hoje: a conclusão da nova
 * ocorrência atual, para continuar feita. Null quando não precisa de nenhuma.
 */
export function conclusaoAoReprogramar(
  antes: ChecklistItem,
  depois: Recorrencia,
  conclusoes: Conclusoes,
  hoje = hojeSP(),
): LinhaConclusao | null {
  if (!depois.diaria) return null;
  if (antes.diaria && mesmosDias(antes.dias_semana, depois.dias_semana)) return null;
  if (!concluidaHoje(antes, conclusoes, hoje)) return null;
  const data = ocorrenciaAtual(depois, hoje);
  if (!data || conclusoes.has(chaveConclusao(antes.id, data))) return null;
  return { tarefaId: antes.id, data };
}

/**
 * Na recorrente, o status exibido é o da ocorrência atual; o gravado não entra na conta.
 * Sem ocorrência ainda, fica fora dos pendentes (como concluída).
 */
export function comStatusDoDia(item: ChecklistItem, conclusoes: Conclusoes, hoje = hojeSP()): ChecklistItem {
  if (!item.diaria) return item;
  const ocorrencia = ocorrenciaAtual(item, hoje);
  const feita = ocorrencia === null || conclusoes.has(chaveConclusao(item.id, ocorrencia));
  return { ...item, status: feita ? "feito" : "a_fazer" };
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

/**
 * Recorrente não grava o status normal. Ao desligar, vira tarefa comum: concluída se a
 * ocorrência atual foi feita, senão pendente; dias_semana volta a null. As conclusões ficam.
 */
export function camposParaGravar(antes: ChecklistItem, campos: CamposGravacao, feitaAgora: boolean): CamposGravacao {
  let saida = campos;
  if ("dias_semana" in saida) saida = { ...saida, dias_semana: normalizarDias(saida.dias_semana) };
  if (saida.diaria === false) saida = { ...saida, dias_semana: null };
  if (!antes.diaria) return saida;
  if (saida.diaria === false) return { ...saida, status: feitaAgora ? "feito" : "a_fazer" };
  if (!("status" in saida)) return saida;
  const { status: _status, ...resto } = saida;
  return resto;
}

/**
 * Entrar numa lista que repete liga a tarefa com os dias da lista (ou os escolhidos no drawer).
 * Sair de uma lista que repete para uma normal desliga, com a regra do dia.
 */
export function diariaAoMudarDeLista(
  antes: ChecklistItem,
  campos: CamposGravacao,
  origemDiaria: boolean,
  destino: RepeticaoLista | null,
  feitaAgora: boolean,
): CamposGravacao {
  if (!campos.grupo_id || campos.grupo_id === antes.grupo_id) return campos;
  if (destino?.diaria) {
    const { status: _status, ...resto } = campos;
    const dias = "dias_semana" in campos && campos.diaria === true ? campos.dias_semana : camposDaLista(destino).dias_semana;
    return { ...resto, diaria: true, dias_semana: normalizarDias(dias) };
  }
  // Arrastar não manda `diaria`. O drawer manda true só quando a pessoa escolhe repetir.
  if (origemDiaria && campos.diaria !== true) {
    return { ...campos, diaria: false, dias_semana: null, status: feitaAgora ? "feito" : "a_fazer" };
  }
  return campos;
}

/** Liga a repetição em todas as tarefas do grupo, com os dias da lista. O status gravado não muda. */
export async function ligarItensDaLista(grupoId: string, lista: RepeticaoLista) {
  const { error } = await supabase.from("checklist_itens").update(camposDaLista(lista)).eq("grupo_id", grupoId);
  falhar(error);
}

/**
 * Desliga a diária de todas as tarefas do grupo (e zera os dias). Quem está feita na ocorrência
 * atual fica concluída; as outras ficam pendentes. O histórico de conclusões não é apagado.
 */
export async function desligarItensDaLista(grupoId: string, feitas: string[]) {
  const pendentes = await supabase
    .from("checklist_itens")
    .update({ diaria: false, dias_semana: null, status: "a_fazer" })
    .eq("grupo_id", grupoId);
  falhar(pendentes.error);
  if (feitas.length === 0) return;
  const concluidas = await supabase
    .from("checklist_itens")
    .update({ diaria: false, dias_semana: null, status: "feito" })
    .eq("grupo_id", grupoId)
    .in("id", feitas);
  falhar(concluidas.error);
}
