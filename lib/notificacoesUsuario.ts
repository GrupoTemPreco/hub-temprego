import { supabase } from "@/lib/supabase";
import type { Notificacao, NotificacaoLeitura } from "@/lib/types/shell";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Notificações ativas e ainda não encerradas, com as leituras da pessoa. O período é reavaliado no front. */
export async function carregarNotificacoesDoUsuario(usuarioId: string) {
  const agora = new Date().toISOString();
  const [n, l] = await Promise.all([
    supabase.from("notificacoes").select("*").eq("ativa", true).or(`fim_em.is.null,fim_em.gt.${agora}`),
    supabase.from("notificacao_leituras").select("*").eq("usuario_id", usuarioId),
  ]);
  falhar(n.error);
  falhar(l.error);
  return {
    notificacoes: (n.data ?? []) as Notificacao[],
    leituras: (l.data ?? []) as NotificacaoLeitura[],
  };
}

const CHAVE = { onConflict: "notificacao_id,usuario_id" };

/** Grava visto_em só se ainda não existir leitura (não toca em confirmado_em). */
export async function marcarNotificacaoVista(notificacaoId: string, usuarioId: string) {
  const { error } = await supabase
    .from("notificacao_leituras")
    .upsert(
      { notificacao_id: notificacaoId, usuario_id: usuarioId, visto_em: new Date().toISOString() },
      { ...CHAVE, ignoreDuplicates: true },
    );
  falhar(error);
}

/**
 * Grava confirmado_em reenviando o visto_em já conhecido, para não perdê-lo.
 * Quem chama não deve chamar de novo quando confirmado_em já estiver preenchido.
 */
export async function marcarNotificacaoConfirmada(
  notificacaoId: string,
  usuarioId: string,
  vistoEm: string,
  confirmadoEm: string,
) {
  const { error } = await supabase
    .from("notificacao_leituras")
    .upsert(
      { notificacao_id: notificacaoId, usuario_id: usuarioId, visto_em: vistoEm, confirmado_em: confirmadoEm },
      CHAVE,
    );
  falhar(error);
}
