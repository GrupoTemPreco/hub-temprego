import { supabase } from "@/lib/supabase";

export const COLUNAS_PADRAO = 3;
export const COLUNAS_MIN = 1;
export const COLUNAS_MAX = 8;

export type FaixaTela = "celular" | "tablet" | "desktop";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Inteiro entre 1 e 8; qualquer outro valor volta ao padrão. */
export function limitarColunas(valor: unknown) {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isInteger(n) || n < COLUNAS_MIN || n > COLUNAS_MAX) return COLUNAS_PADRAO;
  return n;
}

/** A preferência salva não muda: celular fica em 1 e tablet em no máximo 2. */
export function colunasNaTela(preferidas: number, faixa: FaixaTela) {
  const n = limitarColunas(preferidas);
  if (faixa === "celular") return 1;
  if (faixa === "tablet") return Math.min(2, n);
  return n;
}

export async function lerChecklistColunas(usuarioId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("checklist_colunas")
    .eq("id", usuarioId)
    .maybeSingle();
  falhar(error);
  return limitarColunas(data?.checklist_colunas);
}

export async function salvarChecklistColunas(usuarioId: string, colunas: number) {
  const { error } = await supabase
    .from("usuarios")
    .update({ checklist_colunas: limitarColunas(colunas) })
    .eq("id", usuarioId);
  falhar(error);
}
