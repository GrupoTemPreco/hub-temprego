import { hojeSP } from "@/lib/checklistRegras";
import type { ItemRh, ResumoUsuarioRh } from "@/lib/rhMonitoramento";

/** Abaixo disso, o "% no prazo" não é calculado nem comparado. */
export const MIN_TAREFAS_COM_PRAZO = 5;
export const DIAS_SEM_CHECKLIST = 7;
const LIMITE_PRAZO_BAIXO = 0.5;
const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;

/** Abaixo de 48 h: "X h"; acima: "X dias" com uma casa decimal. */
export function formatarHoras(horas: number | null) {
  if (horas == null || !Number.isFinite(horas)) return "—";
  if (horas < 48) return `${Math.round(horas)} h`;
  return `${(horas / 24).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dias`;
}

export function horasEntre(inicio: string | null, fim: string | null) {
  if (!inicio || !fim) return null;
  return (new Date(fim).getTime() - new Date(inicio).getTime()) / HORA_MS;
}

/** Fração entregue no prazo; nula com menos de 5 tarefas com prazo concluídas no período. */
export function fracaoNoPrazo(u: Pick<ResumoUsuarioRh, "concluidas_com_prazo" | "concluidas_no_prazo">) {
  return u.concluidas_com_prazo < MIN_TAREFAS_COM_PRAZO ? null : u.concluidas_no_prazo / u.concluidas_com_prazo;
}

export const formatarPercentual = (f: number | null) => (f == null ? "—" : `${Math.round(f * 100)}%`);

/** Dias desde o último acesso ao checklist; nulo se nunca abriu. */
export function diasSemChecklist(u: Pick<ResumoUsuarioRh, "ultimo_acesso_checklist_em">, agora: number) {
  return u.ultimo_acesso_checklist_em ? (agora - new Date(u.ultimo_acesso_checklist_em).getTime()) / DIA_MS : null;
}

export function semChecklistHaMuito(u: Pick<ResumoUsuarioRh, "ultimo_acesso_checklist_em">, agora: number) {
  const dias = diasSemChecklist(u, agora);
  return dias === null || dias > DIAS_SEM_CHECKLIST;
}

export type TotaisRh = {
  usandoChecklist: number;
  total: number;
  pendentes: number;
  vencidos: number;
  /** Soma de todos: no prazo / com prazo; nula sem nenhuma tarefa com prazo concluída. */
  noPrazo: number | null;
  /** Média ponderada pelas concluídas de cada pessoa. */
  tempoMedioHoras: number | null;
};

export function calcularTotais(usuarios: ResumoUsuarioRh[], agora: number): TotaisRh {
  const comPrazo = usuarios.reduce((s, u) => s + u.concluidas_com_prazo, 0);
  const noPrazo = usuarios.reduce((s, u) => s + u.concluidas_no_prazo, 0);
  const comTempo = usuarios.filter((u) => u.tempo_medio_horas != null && u.concluidas > 0);
  const concluidasComTempo = comTempo.reduce((s, u) => s + u.concluidas, 0);
  return {
    usandoChecklist: usuarios.filter((u) => !semChecklistHaMuito(u, agora)).length,
    total: usuarios.length,
    pendentes: usuarios.reduce((s, u) => s + u.pendentes, 0),
    vencidos: usuarios.reduce((s, u) => s + u.vencidos, 0),
    noPrazo: comPrazo > 0 ? noPrazo / comPrazo : null,
    tempoMedioHoras:
      concluidasComTempo > 0
        ? comTempo.reduce((s, u) => s + u.tempo_medio_horas! * u.concluidas, 0) / concluidasComTempo
        : null,
  };
}

export type MotivoAtencaoRh = "vencidas" | "criticas" | "sem-resposta" | "sem-acesso" | "prazo-baixo";

export type PontoAtencaoRh = { usuario: ResumoUsuarioRh; motivo: MotivoAtencaoRh; quantidade: number };

/** Gravidade dos motivos: o mais grave primeiro. */
const GRAVIDADE: Record<MotivoAtencaoRh, number> = {
  vencidas: 0,
  criticas: 1,
  "sem-resposta": 2,
  "sem-acesso": 3,
  "prazo-baixo": 4,
};

/** Uma linha por usuário e motivo; dentro do mesmo motivo, quem tem mais primeiro. */
export function pontosDeAtencao(usuarios: ResumoUsuarioRh[], agora: number): PontoAtencaoRh[] {
  const pontos: PontoAtencaoRh[] = [];
  for (const u of usuarios) {
    if (u.vencidos > 0) pontos.push({ usuario: u, motivo: "vencidas", quantidade: u.vencidos });
    if (u.criticos > 0) pontos.push({ usuario: u, motivo: "criticas", quantidade: u.criticos });
    if (u.recebidas_pendentes > 0) pontos.push({ usuario: u, motivo: "sem-resposta", quantidade: u.recebidas_pendentes });
    if (semChecklistHaMuito(u, agora)) {
      pontos.push({ usuario: u, motivo: "sem-acesso", quantidade: Math.floor(diasSemChecklist(u, agora) ?? Infinity) });
    }
    const fracao = fracaoNoPrazo(u);
    if (fracao !== null && fracao < LIMITE_PRAZO_BAIXO) {
      pontos.push({ usuario: u, motivo: "prazo-baixo", quantidade: Math.round(fracao * 100) });
    }
  }
  return pontos.sort((a, b) => {
    const porGravidade = GRAVIDADE[a.motivo] - GRAVIDADE[b.motivo];
    if (porGravidade !== 0) return porGravidade;
    // Prazo baixo: menor percentual primeiro; nos demais, maior quantidade primeiro.
    return a.motivo === "prazo-baixo" ? a.quantidade - b.quantidade : b.quantidade - a.quantidade;
  });
}

/** Até 5 com o maior percentual no prazo (só quem tem o mínimo de tarefas com prazo). */
export function maisEmDia(usuarios: ResumoUsuarioRh[], limite = 5) {
  return usuarios
    .map((u) => ({ usuario: u, fracao: fracaoNoPrazo(u) }))
    .filter((x): x is { usuario: ResumoUsuarioRh; fracao: number } => x.fracao !== null)
    .sort((a, b) => b.fracao - a.fracao || b.usuario.concluidas - a.usuario.concluidas)
    .slice(0, limite);
}

export type SituacaoEntrega = "no-prazo" | "atrasada" | "sem-prazo";

/** Comparação por dia (prazo é data, sem hora), no fuso de São Paulo. */
export function situacaoEntrega(item: Pick<ItemRh, "prazo" | "concluido_em">): SituacaoEntrega {
  if (!item.prazo || !item.concluido_em) return "sem-prazo";
  return hojeSP(new Date(item.concluido_em)) <= item.prazo ? "no-prazo" : "atrasada";
}

/** Itens concluídos dentro do período, do mais recente para o mais antigo. */
export function concluidasNoPeriodo(itens: ItemRh[], dias: number, agora: number) {
  const limite = agora - dias * DIA_MS;
  return itens
    .filter((i) => i.status === "feito" && i.concluido_em && new Date(i.concluido_em).getTime() >= limite)
    .sort((a, b) => b.concluido_em!.localeCompare(a.concluido_em!));
}
