"use client";

import { useEffect } from "react";

const PREFIXO = /^\(\d+\) /;

/**
 * Mostra "(N) " antes do título da aba do navegador enquanto N > 0.
 * Reaplica quando o Next troca o título ao navegar entre telas.
 */
export function useContagemNoTitulo(quantidade: number) {
  useEffect(() => {
    const aplicar = () => {
      const base = document.title.replace(PREFIXO, "");
      const desejado = quantidade > 0 ? `(${quantidade}) ${base}` : base;
      if (document.title !== desejado) document.title = desejado;
    };
    aplicar();
    const observador = new MutationObserver(aplicar);
    observador.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      observador.disconnect();
      document.title = document.title.replace(PREFIXO, "");
    };
  }, [quantidade]);
}
