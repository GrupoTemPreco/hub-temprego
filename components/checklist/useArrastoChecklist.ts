"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type Active,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  montarVisao,
  ordemNaPosicao,
  ordemNoFim,
  type FiltrosChecklist,
} from "@/lib/checklistRegras";
import type { CamposItem } from "@/lib/checklist";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";

/** Prefixos dos ids no DndContext: grupo arrastável, item arrastável e área de soltar da lista. */
type TipoAlvo = "g" | "i" | "l";

export const idGrupo = (id: string) => `g:${id}`;
export const idItem = (id: string) => `i:${id}`;
export const idLista = (id: string) => `l:${id}`;

function lerId(id: UniqueIdentifier): { tipo: TipoAlvo; id: string } {
  const texto = String(id);
  return { tipo: texto.slice(0, 1) as TipoAlvo, id: texto.slice(2) };
}

/**
 * Grupos só colidem com grupos; itens com itens e listas, preferindo o item sob o ponteiro.
 * Itens nunca caem em grupo que o usuário não pode editar (compartilhado só para leitura).
 */
export const detectarColisao: CollisionDetection = (args) => {
  const tipoAtivo = lerId(args.active.id).tipo;
  const alvos = args.droppableContainers.filter((c) =>
    tipoAtivo === "g"
      ? lerId(c.id).tipo === "g"
      : lerId(c.id).tipo !== "g" && c.data.current?.editavel !== false,
  );
  const filtrado = { ...args, droppableContainers: alvos };
  if (tipoAtivo === "g") return closestCenter(filtrado);

  const sob = pointerWithin(filtrado);
  const itensSob = sob.filter((c) => lerId(c.id).tipo === "i");
  if (itensSob.length > 0) return itensSob;
  if (sob.length > 0) {
    // Ponteiro na lista, entre itens ou abaixo deles: usa o item mais próximo daquela lista.
    const grupoId = lerId(sob[0].id).id;
    const daLista = alvos.filter((c) => lerId(c.id).tipo === "i" && c.data.current?.grupoId === grupoId);
    return daLista.length > 0 ? closestCenter({ ...args, droppableContainers: daLista }) : sob;
  }
  return rectIntersection(filtrado);
};

function ficaAbaixo(active: Active, over: Over) {
  const topo = active.rect.current.translated?.top ?? 0;
  return topo > over.rect.top + over.rect.height / 2;
}

type Provisorio = { itemId: string; grupoId: string; ordem: number };

type Params = {
  grupos: ChecklistGrupo[];
  itens: ChecklistItem[];
  filtros: FiltrosChecklist;
  moverItem: (id: string, campos: CamposItem) => void;
  moverGrupo: (id: string, ordem: number) => void;
};

export function useArrastoChecklist({ grupos, itens, filtros, moverItem, moverGrupo }: Params) {
  const [ativo, setAtivo] = useState<{ tipo: TipoAlvo; id: string } | null>(null);
  // Posição do item enquanto ele passa por outro grupo; só vira gravação ao soltar.
  const [provisorio, setProvisorio] = useState<Provisorio | null>(null);
  const manual = filtros.ordenacao === "manual";

  const itensExibidos = useMemo(
    () =>
      provisorio
        ? itens.map((i) =>
            i.id === provisorio.itemId ? { ...i, grupo_id: provisorio.grupoId, ordem: provisorio.ordem } : i,
          )
        : itens,
    [itens, provisorio],
  );
  const visao = useMemo(
    () => montarVisao(grupos.map((g) => g.id), itensExibidos, filtros),
    [grupos, itensExibidos, filtros],
  );

  function grupoDoAlvo(over: Over) {
    const alvo = lerId(over.id);
    if (alvo.tipo === "l") return alvo.id;
    if (alvo.tipo === "i") return itensExibidos.find((i) => i.id === alvo.id)?.grupo_id ?? null;
    return null;
  }

  function limpar() {
    setAtivo(null);
    setProvisorio(null);
  }

  function onDragStart({ active }: DragStartEvent) {
    setAtivo(lerId(active.id));
  }

  function onDragOver({ active, over }: DragOverEvent) {
    const arrastado = lerId(active.id);
    if (!over || arrastado.tipo !== "i") return;
    const destino = grupoDoAlvo(over);
    const atual = itensExibidos.find((i) => i.id === arrastado.id);
    if (!destino || !atual || destino === atual.grupo_id) return;

    let ordem: number;
    if (manual) {
      const lista = (visao.get(destino)?.pendentes ?? []).filter((i) => i.id !== arrastado.id);
      const alvo = lerId(over.id);
      const k = alvo.tipo === "i" ? lista.findIndex((i) => i.id === alvo.id) : -1;
      const indice = k < 0 ? lista.length : ficaAbaixo(active, over) ? k + 1 : k;
      ordem = ordemNaPosicao(lista, indice);
    } else {
      ordem = ordemNoFim(itens.filter((i) => i.grupo_id === destino && i.id !== arrastado.id));
    }
    setProvisorio({ itemId: arrastado.id, grupoId: destino, ordem });
  }

  function soltarGrupo(grupoId: string, over: Over) {
    const alvo = lerId(over.id);
    if (alvo.tipo !== "g" || alvo.id === grupoId) return;
    const de = grupos.findIndex((g) => g.id === grupoId);
    const para = grupos.findIndex((g) => g.id === alvo.id);
    if (de < 0 || para < 0) return;
    const semEle = arrayMove(grupos, de, para).filter((g) => g.id !== grupoId);
    moverGrupo(grupoId, ordemNaPosicao(semEle, para));
  }

  function soltarItem(itemId: string, over: Over) {
    const original = itens.find((i) => i.id === itemId);
    const exibido = itensExibidos.find((i) => i.id === itemId);
    if (!original || !exibido) return;

    let ordem = exibido.ordem;
    const alvo = lerId(over.id);
    if (manual && alvo.tipo === "i") {
      const lista = visao.get(exibido.grupo_id)?.pendentes ?? [];
      const de = lista.findIndex((i) => i.id === itemId);
      const para = lista.findIndex((i) => i.id === alvo.id);
      if (de >= 0 && para >= 0 && de !== para) {
        const semEle = arrayMove(lista, de, para).filter((i) => i.id !== itemId);
        ordem = ordemNaPosicao(semEle, para);
      }
    }

    const mudouGrupo = exibido.grupo_id !== original.grupo_id;
    if (!mudouGrupo && ordem === original.ordem) return;
    moverItem(itemId, mudouGrupo ? { grupo_id: exibido.grupo_id, ordem } : { ordem });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const arrastado = lerId(active.id);
    if (over) {
      if (arrastado.tipo === "g") soltarGrupo(arrastado.id, over);
      else soltarItem(arrastado.id, over);
    }
    limpar();
  }

  const itemAtivo = ativo?.tipo === "i" ? itensExibidos.find((i) => i.id === ativo.id) ?? null : null;
  const grupoAtivo = ativo?.tipo === "g" ? grupos.find((g) => g.id === ativo.id) ?? null : null;

  return {
    visao,
    itemAtivo,
    grupoAtivo,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: limpar },
  };
}
