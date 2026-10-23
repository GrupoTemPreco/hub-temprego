"use client";

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { assinarChecklist, listarGruposPorIds, listarItens } from "@/lib/checklist";
import { assinarParticipacoes, listarMembros, listarParticipacoes } from "@/lib/checklistMembros";
import type { ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";

type Definir<T> = Dispatch<SetStateAction<T[]>>;

type Params = {
  usuarioId: string;
  habilitado: boolean;
  grupoIdsRef: RefObject<Set<string>>;
  membrosRef: RefObject<ChecklistMembro[]>;
  setGrupos: Definir<ChecklistGrupo>;
  setItens: Definir<ChecklistItem>;
  setMembros: Definir<ChecklistMembro>;
  organizarGrupos: (lista: ChecklistGrupo[]) => ChecklistGrupo[];
};

export function upsertPorId<T extends { id: string }>(lista: T[], novo: T) {
  return lista.some((x) => x.id === novo.id) ? lista.map((x) => (x.id === novo.id ? novo : x)) : [...lista, novo];
}

const mesmoMembro = (a: ChecklistMembro, grupoId: string, usuarioId: string) =>
  a.grupo_id === grupoId && a.usuario_id === usuarioId;

export function upsertMembro(lista: ChecklistMembro[], m: ChecklistMembro) {
  return [...lista.filter((x) => !mesmoMembro(x, m.grupo_id, m.usuario_id)), m];
}

/** Grupos e itens (próprios e compartilhados) e as participações do usuário, em tempo real. */
export function useChecklistRealtime(p: Params) {
  const { usuarioId, habilitado, grupoIdsRef, membrosRef, setGrupos, setItens, setMembros, organizarGrupos } = p;

  useEffect(() => {
    if (!habilitado) return;

    const souMembro = (grupoId: string) =>
      membrosRef.current.some((m) => m.grupo_id === grupoId && m.usuario_id === usuarioId);

    function tirarGrupo(grupoId: string) {
      grupoIdsRef.current.delete(grupoId);
      setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
      setItens((prev) => prev.filter((i) => i.grupo_id !== grupoId));
      setMembros((prev) => prev.filter((m) => m.grupo_id !== grupoId));
    }

    /** Grupo recém-compartilhado com o usuário: traz o grupo, os itens e os membros. */
    function trazerGrupo(grupoId: string) {
      Promise.all([listarGruposPorIds([grupoId]), listarItens([grupoId]), listarMembros([grupoId])])
        .then(([[grupo], itens, membros]) => {
          if (!grupo) return;
          grupoIdsRef.current.add(grupo.id);
          setGrupos((prev) => organizarGrupos(upsertPorId(prev, grupo)));
          setItens((prev) => itens.reduce(upsertPorId, prev));
          setMembros((prev) => [...prev.filter((m) => m.grupo_id !== grupoId), ...membros]);
        })
        .catch((err) => console.error("[checklist] Falha ao carregar grupo compartilhado:", err));
    }

    /** Remoção sem a chave no evento: confere no banco o que ainda vale. */
    function reconciliar() {
      listarParticipacoes(usuarioId)
        .then((minhas) => {
          const ainda = new Set(minhas.map((m) => m.grupo_id));
          const perdidos = membrosRef.current.filter((m) => m.usuario_id === usuarioId && !ainda.has(m.grupo_id));
          perdidos.forEach((m) => tirarGrupo(m.grupo_id));
          return listarMembros([...grupoIdsRef.current]);
        })
        .then((membros) => setMembros(membros))
        .catch((err) => console.error("[checklist] Falha ao conferir membros:", err));
    }

    const pararChecklist = assinarChecklist(usuarioId, {
      grupo: (_tipo, novo, antigoId) => {
        if (!novo || novo.arquivado) {
          const id = novo?.id ?? antigoId;
          if (id) setGrupos((prev) => prev.filter((g) => g.id !== id));
          return;
        }
        if (novo.dono_id !== usuarioId && !souMembro(novo.id)) return;
        const conhecido = grupoIdsRef.current.has(novo.id);
        grupoIdsRef.current.add(novo.id);
        setGrupos((prev) => organizarGrupos(upsertPorId(prev, novo)));
        // Grupo desarquivado ou criado em outra aba: traz os itens dele.
        if (!conhecido) {
          listarItens([novo.id])
            .then((lista) => setItens((prev) => lista.reduce(upsertPorId, prev)))
            .catch((err) => console.error("[checklist] Falha ao carregar itens do grupo:", err));
        }
      },
      item: (_tipo, novo, antigoId) => {
        if (novo && grupoIdsRef.current.has(novo.grupo_id)) {
          setItens((prev) => upsertPorId(prev, novo));
          return;
        }
        // Saiu dos grupos do usuário (ex.: aceito por outra pessoa, ou movido para um grupo que ele não vê).
        const id = novo?.id ?? antigoId;
        setItens((prev) => prev.filter((i) => i.id !== id));
      },
    });

    const pararMembros = assinarParticipacoes(usuarioId, {
      mudou: (membro, tipo) => {
        membrosRef.current = upsertMembro(membrosRef.current, membro);
        setMembros((prev) => upsertMembro(prev, membro));
        if (tipo === "INSERT" && !grupoIdsRef.current.has(membro.grupo_id)) trazerGrupo(membro.grupo_id);
      },
      removido: (grupoId, membroId) => {
        if (!grupoId || !membroId) {
          reconciliar();
          return;
        }
        if (membroId === usuarioId) tirarGrupo(grupoId);
        else setMembros((prev) => prev.filter((m) => !mesmoMembro(m, grupoId, membroId)));
      },
    });

    return () => {
      pararChecklist();
      pararMembros();
    };
  }, [usuarioId, habilitado, grupoIdsRef, membrosRef, setGrupos, setItens, setMembros, organizarGrupos]);
}
