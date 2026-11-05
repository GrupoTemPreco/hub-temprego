"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const chave = (usuarioId: string) => `hub:checklist-listas-minimizadas:${usuarioId}`;

function ler(usuarioId: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave(usuarioId));
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as unknown;
    return Array.isArray(lista) ? lista.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function gravar(usuarioId: string, ids: string[]) {
  try {
    if (ids.length === 0) window.localStorage.removeItem(chave(usuarioId));
    else window.localStorage.setItem(chave(usuarioId), JSON.stringify(ids));
  } catch {
    // Sem localStorage, o estado vale só nesta sessão.
  }
}

const VAZIO: string[] = [];
const cache = new Map<string, string[]>();
const ouvintes = new Set<() => void>();

function salvasDe(usuarioId: string) {
  if (!cache.has(usuarioId)) cache.set(usuarioId, ler(usuarioId));
  return cache.get(usuarioId)!;
}

function salvar(usuarioId: string, ids: string[]) {
  cache.set(usuarioId, ids);
  gravar(usuarioId, ids);
  ouvintes.forEach((avisar) => avisar());
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

export type BuscaListas = {
  ativa: boolean;
  /** Listas com algum resultado na busca: começam abertas enquanto ela durar. */
  comResultado?: ReadonlySet<string>;
};

const SEM_BUSCA: BuscaListas = { ativa: false };

/**
 * Ids das listas minimizadas. Sem `usuarioId` (modal do RH) fica só na memória.
 * Lista que não está na chave começa expandida. Durante a busca, os cliques valem
 * só até ela acabar; depois cada lista volta ao estado salvo.
 */
export function useListasMinimizadas(usuarioId: string | null, busca: BuscaListas = SEM_BUSCA) {
  const [memoria, setMemoria] = useState<string[]>(VAZIO);
  const salvas = useSyncExternalStore(
    inscrever,
    () => (usuarioId ? salvasDe(usuarioId) : VAZIO),
    () => VAZIO,
  );
  const ids = usuarioId ? salvas : memoria;
  const [naBusca, setNaBusca] = useState<Record<string, boolean>>({});
  const [buscaAnterior, setBuscaAnterior] = useState(busca.ativa);

  if (buscaAnterior !== busca.ativa) {
    setBuscaAnterior(busca.ativa);
    setNaBusca({});
  }

  const persistir = useCallback(
    (novos: string[]) => (usuarioId ? salvar(usuarioId, novos) : setMemoria(novos)),
    [usuarioId],
  );

  const estaMinimizada = useCallback(
    (id: string) => {
      if (busca.ativa) {
        if (id in naBusca) return naBusca[id];
        if (busca.comResultado?.has(id)) return false;
      }
      return ids.includes(id);
    },
    [busca.ativa, busca.comResultado, ids, naBusca],
  );

  const definir = useCallback(
    (id: string, minimizar: boolean) => {
      if (busca.ativa) {
        setNaBusca((atual) => ({ ...atual, [id]: minimizar }));
        return;
      }
      if (minimizar === ids.includes(id)) return;
      persistir(minimizar ? [...ids, id] : ids.filter((atual) => atual !== id));
    },
    [busca.ativa, ids, persistir],
  );

  const definirTodas = useCallback(
    (grupoIds: string[], minimizar: boolean) => {
      if (busca.ativa) setNaBusca(Object.fromEntries(grupoIds.map((id) => [id, minimizar])));
      else persistir(minimizar ? [...grupoIds] : []);
    },
    [busca.ativa, persistir],
  );

  const todasMinimizadas = useCallback(
    (grupoIds: string[]) => grupoIds.length > 0 && grupoIds.every(estaMinimizada),
    [estaMinimizada],
  );

  return { definir, definirTodas, todasMinimizadas, estaMinimizada };
}

export type ListasMinimizadas = ReturnType<typeof useListasMinimizadas>;
