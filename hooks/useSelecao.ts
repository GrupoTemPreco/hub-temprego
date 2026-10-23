"use client";

import { useCallback, useState } from "react";

/**
 * Seleção de linhas para ações em massa. A seleção sobrevive à troca de filtros;
 * "selecionar todos" vale para os ids visíveis no momento.
 */
export function useSelecao(idsVisiveis: string[]) {
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());

  const visiveisMarcados = idsVisiveis.filter((id) => selecionados.has(id)).length;
  const todosVisiveis = idsVisiveis.length > 0 && visiveisMarcados === idsVisiveis.length;

  const alternar = useCallback((id: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }, []);

  const alternarTodosVisiveis = () =>
    setSelecionados((prev) => {
      const novo = new Set(prev);
      for (const id of idsVisiveis) {
        if (todosVisiveis) novo.delete(id);
        else novo.add(id);
      }
      return novo;
    });

  const limpar = useCallback(() => setSelecionados(new Set()), []);

  return {
    ids: [...selecionados],
    total: selecionados.size,
    estaSelecionado: (id: string) => selecionados.has(id),
    alternar,
    alternarTodosVisiveis,
    todosVisiveis,
    /** Parte dos visíveis marcada: o checkbox do cabeçalho fica "indeterminado". */
    algunsVisiveis: visiveisMarcados > 0 && !todosVisiveis,
    limpar,
  };
}

export type Selecao = ReturnType<typeof useSelecao>;
