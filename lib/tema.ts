import { supabase } from "@/lib/supabase";

export type Tema = "escuro" | "claro";

export const CHAVE_TEMA = "hub-tema";
export const TEMA_PADRAO: Tema = "escuro";

/** Roda no <head>, antes de pintar, para o tema do localStorage valer sem flash. */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE_TEMA}");if(t!=="claro")t="escuro";var r=document.documentElement;r.setAttribute("data-tema",t);r.style.colorScheme=t==="claro"?"light":"dark";}catch(e){}})();`;

export function temaValido(valor: unknown): valor is Tema {
  return valor === "escuro" || valor === "claro";
}

export function lerTemaLocal(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    return temaValido(salvo) ? salvo : TEMA_PADRAO;
  } catch {
    return TEMA_PADRAO;
  }
}

/** Aplica na hora: atributo, color-scheme e localStorage. */
export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  raiz.setAttribute("data-tema", tema);
  raiz.style.colorScheme = tema === "claro" ? "light" : "dark";
  localStorage.setItem(CHAVE_TEMA, tema);
}

export async function salvarTemaNoBanco(usuarioId: string, tema: Tema) {
  const { error } = await supabase.from("usuarios").update({ tema }).eq("id", usuarioId);
  if (error) throw new Error(error.message);
}

/** Se o banco e o localStorage divergirem, o banco vence. */
export function sincronizarTemaDoBanco(temaBanco: unknown) {
  const tema = temaValido(temaBanco) ? temaBanco : TEMA_PADRAO;
  if (tema !== lerTemaLocal()) aplicarTema(tema);
  return tema;
}
