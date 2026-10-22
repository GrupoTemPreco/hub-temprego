import { supabase } from "@/lib/supabase";

export type RegistrarAcaoParams = {
  acao: string;
  alvo_tipo: string;
  alvo_id: string | null;
  /** Frase sem o nome do autor, ex.: "aprovou o usuário Camila Ramos". */
  descricao: string;
  dados?: Record<string, unknown>;
};

/** Grava em shell.admin_log. Nunca lança erro: falhas só vão para o console. */
export async function registrarAcao(params: RegistrarAcaoParams): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("admin_log").insert({
      autor_id: session?.user.id ?? null,
      acao: params.acao,
      alvo_tipo: params.alvo_tipo,
      alvo_id: params.alvo_id,
      descricao: params.descricao,
      dados: params.dados ?? null,
    });

    if (error) console.error("[admin_log] Falha ao registrar ação:", error.message, params);
  } catch (err) {
    console.error("[admin_log] Falha ao registrar ação:", err, params);
  }
}
