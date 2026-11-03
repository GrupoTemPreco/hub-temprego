"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { desmarcarConclusaoDeHoje, listarConclusoesDeHoje, marcarConclusaoDeHoje } from "@/lib/checklistDiarias";
import { hojeSP } from "@/lib/checklistRegras";

const INTERVALO_MS = 30_000;

/** Conclusões de hoje e a virada do dia em São Paulo (relógio ou aba que volta a ficar visível). */
export function useConclusoesHoje(usuarioId: string, ativo: boolean) {
  const [feitas, setFeitas] = useState<Set<string>>(() => new Set());
  const epoca = useRef(0);

  const substituir = useCallback((ids: Iterable<string>, lida: number) => {
    if (lida !== epoca.current) return;
    setFeitas(new Set(ids));
  }, []);

  const epocaAtual = useCallback(() => epoca.current, []);

  const recarregar = useCallback(async (limpar = false) => {
    const lida = ++epoca.current;
    if (limpar) setFeitas(new Set());
    const ids = await listarConclusoesDeHoje();
    if (lida !== epoca.current) return;
    setFeitas(new Set(ids));
  }, []);

  useEffect(() => {
    if (!ativo) return;
    let dia = hojeSP();
    const conferirDia = () => {
      const agora = hojeSP();
      if (agora === dia) return;
      void recarregar(true)
        .then(() => {
          dia = agora;
        })
        .catch((err) => console.error("[checklist] Falha ao recarregar o dia:", err));
    };
    const aoVisivel = () => {
      if (document.visibilityState === "visible") conferirDia();
    };
    document.addEventListener("visibilitychange", aoVisivel);
    const timer = window.setInterval(conferirDia, INTERVALO_MS);
    return () => {
      document.removeEventListener("visibilitychange", aoVisivel);
      window.clearInterval(timer);
    };
  }, [ativo, recarregar]);

  const incluir = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    epoca.current += 1;
    setFeitas((prev) => juntar(prev, ids));
  }, []);

  const retirar = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    epoca.current += 1;
    setFeitas((prev) => {
      const proximo = new Set(prev);
      for (const id of ids) proximo.delete(id);
      return proximo;
    });
  }, []);

  const alternar = useCallback(
    async (tarefaId: string, concluir: boolean) => {
      const hoje = hojeSP();
      epoca.current += 1;
      setFeitas((prev) => alterarConjunto(prev, tarefaId, concluir));
      try {
        if (concluir) await marcarConclusaoDeHoje(tarefaId, usuarioId, hoje);
        else await desmarcarConclusaoDeHoje(tarefaId, hoje);
      } catch (err) {
        setFeitas((prev) => alterarConjunto(prev, tarefaId, !concluir));
        throw err;
      }
    },
    [usuarioId],
  );

  return { feitas, substituir, epocaAtual, recarregar, incluir, retirar, alternar };
}

function alterarConjunto(atual: Set<string>, id: string, incluir: boolean) {
  const proximo = new Set(atual);
  if (incluir) proximo.add(id);
  else proximo.delete(id);
  return proximo;
}

function juntar(atual: Set<string>, ids: string[]) {
  const proximo = new Set(atual);
  for (const id of ids) proximo.add(id);
  return proximo;
}
