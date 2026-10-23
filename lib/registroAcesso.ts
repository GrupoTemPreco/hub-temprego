import { supabase } from "@/lib/supabase";

export const INTERVALO_REGISTRO_MS = 5 * 60_000;

export type ResultadoRegistro = { ok: true; anterior: string | null } | { ok: false };

/**
 * Grava o acesso do usuário logado (ao hub e, com `checklist`, ao checklist) e devolve o
 * ultimo_acesso_em de antes da chamada (nulo no primeiro acesso). Falha só vai para o console.
 */
export async function registrarAcesso(checklist: boolean): Promise<ResultadoRegistro> {
  try {
    const { data, error } = await supabase.rpc("registrar_acesso", { p_checklist: checklist });
    if (error) {
      console.error("[acesso] Falha ao registrar acesso:", error.message);
      return { ok: false };
    }
    return { ok: true, anterior: (data as string | null) ?? null };
  } catch (err) {
    console.error("[acesso] Falha ao registrar acesso:", err);
    return { ok: false };
  }
}

let ultimoRegistroChecklist = 0;

/** Ao abrir a aba Checklist: no máximo uma vez a cada 5 minutos (vale para a aba do navegador inteira). */
export function registrarAcessoChecklist() {
  if (Date.now() - ultimoRegistroChecklist < INTERVALO_REGISTRO_MS) return;
  ultimoRegistroChecklist = Date.now();
  void registrarAcesso(true);
}
