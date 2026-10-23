import { supabase } from "@/lib/supabase";
import type { ChecklistEnvio, ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";

// O monitoramento lê SOMENTE pelas RPCs rh_checklist_resumo e rh_checklist_usuario.

export const PERIODOS_RH = [7, 30, 90] as const;
export type PeriodoRh = (typeof PERIODOS_RH)[number];

/** Uma linha por usuário aprovado com acesso ao checklist (sem admins). Números de concluídas, tempo e recusadas são do período. */
export type ResumoUsuarioRh = {
  usuario_id: string;
  nome: string | null;
  email: string | null;
  setores: string[];
  ultimo_acesso_em: string | null;
  ultimo_acesso_checklist_em: string | null;
  ultima_atividade_em: string | null;
  pendentes: number;
  criticos: number;
  vencidos: number;
  concluidas: number;
  concluidas_com_prazo: number;
  concluidas_no_prazo: number;
  tempo_medio_horas: number | null;
  recebidas_pendentes: number;
  recusadas: number;
};

/** inicio_em: o aceite, quando a tarefa veio de um envio; senão, a criação. */
export type ItemRh = ChecklistItem & { inicio_em: string };
export type EnvioRh = ChecklistEnvio & { de_nome: string | null; para_nome: string | null };
export type DetalheUsuarioRh = { listas: ChecklistGrupo[]; itens: ItemRh[]; envios: EnvioRh[] };

const CAMPOS_NUMERICOS = [
  "pendentes",
  "criticos",
  "vencidos",
  "concluidas",
  "concluidas_com_prazo",
  "concluidas_no_prazo",
  "recebidas_pendentes",
  "recusadas",
] as const;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Contagens podem chegar como texto (bigint/numeric); aqui viram número. */
function normalizar(linha: Record<string, unknown>): ResumoUsuarioRh {
  const r = { ...linha } as Record<string, unknown>;
  for (const campo of CAMPOS_NUMERICOS) r[campo] = Number(r[campo] ?? 0);
  r.tempo_medio_horas = r.tempo_medio_horas == null ? null : Number(r.tempo_medio_horas);
  r.setores = Array.isArray(r.setores) ? r.setores : [];
  return r as ResumoUsuarioRh;
}

export async function carregarResumoRh(dias: PeriodoRh): Promise<ResumoUsuarioRh[]> {
  const { data, error } = await supabase.rpc("rh_checklist_resumo", { p_dias: dias });
  falhar(error);
  return ((data ?? []) as Record<string, unknown>[]).map(normalizar);
}

export async function carregarDetalheRh(usuarioId: string): Promise<DetalheUsuarioRh> {
  const { data, error } = await supabase.rpc("rh_checklist_usuario", { p_usuario_id: usuarioId });
  falhar(error);
  const d = (data ?? {}) as Partial<DetalheUsuarioRh>;
  return { listas: d.listas ?? [], itens: d.itens ?? [], envios: d.envios ?? [] };
}
