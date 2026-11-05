"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chaveConclusao,
  desmarcarConclusao,
  listarConclusoesRecentes,
  marcarConclusoes,
  type LinhaConclusao,
} from "@/lib/checklistDiarias";
import { hojeSP } from "@/lib/checklistRegras";

const INTERVALO_MS = 30_000;

type Mapa = Map<string, string | null>;

/**
 * Conclusões dos últimos 7 dias das tarefas recorrentes e a virada do dia em São Paulo
 * (relógio ou aba que volta a ficar visível). Quem decide se está feita é a ocorrência atual.
 */
export function useConclusoesHoje(usuarioId: string, ativo: boolean) {
  const [conclusoes, setConclusoes] = useState<Mapa>(() => new Map());
  const [dia, setDia] = useState(() => hojeSP());
  const epoca = useRef(0);

  const substituir = useCallback((mapa: Mapa, lida: number) => {
    if (lida !== epoca.current) return;
    setConclusoes(new Map(mapa));
  }, []);

  const epocaAtual = useCallback(() => epoca.current, []);

  const recarregar = useCallback(async (limpar = false) => {
    const lida = ++epoca.current;
    if (limpar) setConclusoes(new Map());
    const mapa = await listarConclusoesRecentes();
    if (lida !== epoca.current) return;
    setConclusoes(mapa);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    let atual = hojeSP();
    const conferirDia = () => {
      const agora = hojeSP();
      if (agora === atual) return;
      void recarregar(true)
        .then(() => {
          atual = agora;
          setDia(agora);
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

  const incluir = useCallback((linhas: LinhaConclusao[]) => {
    if (linhas.length === 0) return;
    epoca.current += 1;
    setConclusoes((prev) => alterar(prev, linhas, true));
  }, []);

  const retirar = useCallback((linhas: LinhaConclusao[]) => {
    if (linhas.length === 0) return;
    epoca.current += 1;
    setConclusoes((prev) => alterar(prev, linhas, false));
  }, []);

  /** Marca ou desmarca a conclusão de `data` (a ocorrência atual da tarefa). */
  const alternar = useCallback(
    async (tarefaId: string, data: string, concluir: boolean) => {
      const linha = [{ tarefaId, data }];
      epoca.current += 1;
      setConclusoes((prev) => alterar(prev, linha, concluir));
      try {
        if (concluir) await marcarConclusoes(linha, usuarioId);
        else await desmarcarConclusao(tarefaId, data);
      } catch (err) {
        setConclusoes((prev) => alterar(prev, linha, !concluir));
        throw err;
      }
    },
    [usuarioId],
  );

  return { conclusoes, dia, substituir, epocaAtual, recarregar, incluir, retirar, alternar };
}

function alterar(atual: Mapa, linhas: LinhaConclusao[], incluir: boolean) {
  const proximo = new Map(atual);
  const agora = new Date().toISOString();
  for (const { tarefaId, data } of linhas) {
    const chave = chaveConclusao(tarefaId, data);
    if (!incluir) proximo.delete(chave);
    else if (!proximo.has(chave)) proximo.set(chave, agora);
  }
  return proximo;
}
