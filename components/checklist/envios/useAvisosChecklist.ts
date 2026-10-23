"use client";

import { useCallback, useEffect, useState } from "react";

/** Para onde o "Abrir" do cartão leva. */
export type DestinoAvisoChecklist =
  | { tipo: "recebidas" }
  | { tipo: "enviadas" }
  | { tipo: "item"; itemId: string }
  | { tipo: "checklist" };

export type AvisoChecklist = {
  /** Única por acontecimento (ex.: "aceito:<envio>"), para não repetir o mesmo aviso. */
  chave: string;
  titulo: string;
  detalhe?: string;
  destino: DestinoAvisoChecklist;
  /** Avisos de quem enviou (aceite ou recusa de todos): o lote a que se referem. */
  loteId?: string;
  /** Só no aceite: o "Ok" do cartão grava ciente_em no lote. */
  cienteAoDispensar?: boolean;
  /** Avisos de quem recebeu: saem quando o envio deixa de estar pendente (ex.: "encerrado"). */
  envioRecebidoId?: string;
  recebidoEm: string;
};

const chaveStorage = (usuarioId: string) => `hub:avisos-checklist:${usuarioId}`;

function ler(usuarioId: string): AvisoChecklist[] {
  try {
    const lista = JSON.parse(window.localStorage.getItem(chaveStorage(usuarioId)) ?? "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvar(usuarioId: string, lista: AvisoChecklist[]) {
  try {
    if (lista.length) window.localStorage.setItem(chaveStorage(usuarioId), JSON.stringify(lista));
    else window.localStorage.removeItem(chaveStorage(usuarioId));
  } catch {
    // Sem localStorage, os avisos não sobrevivem ao recarregamento.
  }
}

/** Avisos do checklist no cartão do balão: ficam até "Ok"/"Abrir" e sobrevivem ao recarregamento. */
export function useAvisosChecklist(usuarioId: string) {
  const [lista, setLista] = useState<AvisoChecklist[]>(() => ler(usuarioId));
  const [balancos, setBalancos] = useState(0);

  useEffect(() => salvar(usuarioId, lista), [usuarioId, lista]);

  const adicionar = useCallback((aviso: AvisoChecklist) => {
    setLista((prev) => (prev.some((a) => a.chave === aviso.chave) ? prev : [...prev, aviso]));
    setBalancos((n) => n + 1);
  }, []);

  const remover = useCallback((filtro: (a: AvisoChecklist) => boolean) => {
    setLista((prev) => prev.filter((a) => !filtro(a)));
  }, []);

  const limpar = useCallback(() => setLista([]), []);

  return { lista, balancos, adicionar, remover, limpar };
}
