import { supabase } from "@/lib/supabase";

// Leitura e gravação de shell.configuracoes (chave, valor jsonb, atualizado_em, atualizado_por).

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Valor da chave, ou `padrao` se ela não existir. */
export async function lerConfiguracao<T>(chave: string, padrao: T): Promise<T> {
  const { data, error } = await supabase.from("configuracoes").select("valor").eq("chave", chave).maybeSingle();
  falhar(error);
  return data ? (data.valor as T) : padrao;
}

/** Cria ou atualiza a chave, registrando quem alterou e quando. */
export async function gravarConfiguracao(chave: string, valor: unknown, usuarioId: string) {
  const { error } = await supabase
    .from("configuracoes")
    .upsert(
      { chave, valor, atualizado_em: new Date().toISOString(), atualizado_por: usuarioId },
      { onConflict: "chave" },
    );
  falhar(error);
}
