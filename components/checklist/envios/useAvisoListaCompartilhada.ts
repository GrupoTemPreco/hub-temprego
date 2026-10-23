"use client";

import { useEffect, type RefObject } from "react";
import { listarGruposPorIds } from "@/lib/checklist";
import { assinarParticipacoes } from "@/lib/checklistMembros";
import type { PessoaChecklist } from "@/lib/checklistEnvios";
import type { AvisoChecklist } from "./useAvisosChecklist";

type Params = {
  ativo: boolean;
  usuarioId: string;
  pessoasRef: RefObject<PessoaChecklist[]>;
  adicionarAviso: (aviso: AvisoChecklist) => void;
  tocar: () => void;
};

/** Aviso e som quando uma lista é compartilhada com o usuário (a grade do checklist cuida de exibi-la). */
export function useAvisoListaCompartilhada({ ativo, usuarioId, pessoasRef, adicionarAviso, tocar }: Params) {
  useEffect(() => {
    if (!ativo) return;
    return assinarParticipacoes(usuarioId, {
      mudou: (membro, tipo) => {
        if (tipo !== "INSERT") return;
        listarGruposPorIds([membro.grupo_id])
          .then(([lista]) => {
            if (!lista) return;
            const dono = pessoasRef.current.find((p) => p.id === lista.dono_id);
            adicionarAviso({
              chave: `compartilhado:${lista.id}:${membro.adicionado_em}`,
              titulo: `${dono?.nome || dono?.email || "Alguém"} compartilhou a lista ${lista.nome} com você`,
              destino: { tipo: "checklist" },
              recebidoEm: new Date().toISOString(),
            });
            tocar();
          })
          .catch((err) => console.error("[checklist-envios] Falha ao ler a lista compartilhada:", err));
      },
      removido: () => {},
    });
  }, [ativo, usuarioId, pessoasRef, adicionarAviso, tocar]);
}
