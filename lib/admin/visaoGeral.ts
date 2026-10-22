import { supabase } from "@/lib/supabase";
import { FILTRO_STATUS_ENCERRADOS, limiteParado as calcularLimiteParado } from "@/lib/tickets";

export type ResumoAdmin = {
  usuariosPendentes: number;
  ticketsAbertos: number;
  ticketsAtrasados: number;
  ticketsParados: number;
  notificacoesAtivas: number;
  setoresSemResponsavel: number;
};

function contarTicketsAbertos() {
  return supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .not("status", "in", FILTRO_STATUS_ENCERRADOS)
    .is("excluido_em", null);
}

async function contar(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function carregarResumo(): Promise<ResumoAdmin> {
  const agora = new Date().toISOString();
  const limiteParado = calcularLimiteParado().toISOString();

  const [usuariosPendentes, ticketsAbertos, ticketsAtrasados, ticketsParados, notificacoesAtivas, setoresSemResponsavel] =
    await Promise.all([
      contar(
        supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ),
      contar(contarTicketsAbertos()),
      contar(contarTicketsAbertos().lt("prazo_em", agora)),
      contar(contarTicketsAbertos().lt("atualizado_em", limiteParado)),
      contar(
        supabase
          .from("notificacoes")
          .select("id", { count: "exact", head: true })
          .eq("ativa", true)
          .lte("inicio_em", agora)
          .or(`fim_em.is.null,fim_em.gt.${agora}`),
      ),
      contar(
        supabase
          .from("setores")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true)
          .is("responsavel_id", null),
      ),
    ]);

  return {
    usuariosPendentes,
    ticketsAbertos,
    ticketsAtrasados,
    ticketsParados,
    notificacoesAtivas,
    setoresSemResponsavel,
  };
}
