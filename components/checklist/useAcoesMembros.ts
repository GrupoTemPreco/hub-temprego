"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useToast } from "@/components/ui/Toast";
import { adicionarMembro, alterarMembro, removerMembro } from "@/lib/checklistMembros";
import type { ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";
import { upsertMembro } from "./useChecklistRealtime";

export type AcoesMembros = {
  /** Dono: compartilha o grupo com uma pessoa. */
  compartilhar: (grupoId: string, usuarioId: string, podeEditar: boolean) => Promise<boolean>;
  alterarPodeEditar: (grupoId: string, usuarioId: string, podeEditar: boolean) => Promise<boolean>;
  removerDoGrupo: (grupoId: string, usuarioId: string) => Promise<boolean>;
  /** Membro: deixa de ver o grupo. */
  sairDoGrupo: (grupoId: string) => Promise<boolean>;
};

type Params = {
  usuarioId: string;
  setMembros: Dispatch<SetStateAction<ChecklistMembro[]>>;
  setGrupos: Dispatch<SetStateAction<ChecklistGrupo[]>>;
  setItens: Dispatch<SetStateAction<ChecklistItem[]>>;
  grupoIdsRef: RefObject<Set<string>>;
};

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function useAcoesMembros({ usuarioId, setMembros, setGrupos, setItens, grupoIdsRef }: Params): AcoesMembros {
  const toast = useToast();

  async function tentar(acao: () => Promise<void>, erro: string) {
    try {
      await acao();
      return true;
    } catch (err) {
      toast.error(`${erro}: ${mensagem(err)}`);
      return false;
    }
  }

  return {
    compartilhar: (grupoId, membroId, podeEditar) =>
      tentar(async () => {
        const novo = await adicionarMembro(grupoId, membroId, podeEditar);
        setMembros((prev) => upsertMembro(prev, novo));
      }, "Não foi possível compartilhar"),

    alterarPodeEditar: (grupoId, membroId, podeEditar) =>
      tentar(async () => {
        await alterarMembro(grupoId, membroId, { pode_editar: podeEditar });
        setMembros((prev) =>
          prev.map((m) => (m.grupo_id === grupoId && m.usuario_id === membroId ? { ...m, pode_editar: podeEditar } : m)),
        );
      }, "Não foi possível alterar a permissão"),

    removerDoGrupo: (grupoId, membroId) =>
      tentar(async () => {
        await removerMembro(grupoId, membroId);
        setMembros((prev) => prev.filter((m) => !(m.grupo_id === grupoId && m.usuario_id === membroId)));
      }, "Não foi possível remover da lista"),

    sairDoGrupo: (grupoId) =>
      tentar(async () => {
        await removerMembro(grupoId, usuarioId);
        grupoIdsRef.current.delete(grupoId);
        setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
        setItens((prev) => prev.filter((i) => i.grupo_id !== grupoId));
        setMembros((prev) => prev.filter((m) => m.grupo_id !== grupoId));
      }, "Não foi possível sair da lista"),
  };
}
