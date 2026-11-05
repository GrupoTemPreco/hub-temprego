"use client";

import { useCallback, useEffect, useState } from "react";
import { assinarEnvios, listarTarefasAceitasRecebidas } from "@/lib/checklistEnvios";
import { assinarEnviosLista, listarListasAceitasRecebidas } from "@/lib/checklistEnviosLista";
import { mapaOrigens, registrarOrigem, type OrigemRecebida } from "@/lib/checklistOrigem";

const vazio = new Map<string, OrigemRecebida>();

/** Origem dos envios aceitos em que o usuário logado é o destinatário (transferência ou cópia). */
export function useOrigensRecebidas(usuarioId: string, ativo: boolean, nomeDe: (id: string | null) => string) {
  const [tarefas, setTarefas] = useState(vazio);
  const [listas, setListas] = useState(vazio);

  useEffect(() => {
    if (!ativo) {
      setTarefas(vazio);
      setListas(vazio);
      return;
    }
    let vivo = true;
    Promise.all([listarTarefasAceitasRecebidas(usuarioId), listarListasAceitasRecebidas(usuarioId)])
      .then(([envios, enviosLista]) => {
        if (!vivo) return;
        setTarefas(mapaOrigens(envios, (e) => e.copia_item_id ?? e.item_id, nomeDe));
        setListas(mapaOrigens(enviosLista, (e) => e.copia_grupo_id ?? e.grupo_id, nomeDe));
      })
      .catch((err) => console.error("[checklist-envios] Falha ao carregar origem das recebidas:", err));

    const offTarefas = assinarEnvios(usuarioId, (envio) => {
      if (envio.status !== "aceito" || envio.para_usuario_id !== usuarioId) return;
      setTarefas((prev) => registrarOrigem(prev, envio.copia_item_id ?? envio.item_id, envio, nomeDe));
    });
    const offListas = assinarEnviosLista(usuarioId, (envio) => {
      if (envio.status !== "aceito" || envio.para_usuario_id !== usuarioId) return;
      setListas((prev) => registrarOrigem(prev, envio.copia_grupo_id ?? envio.grupo_id, envio, nomeDe));
    });
    return () => {
      vivo = false;
      offTarefas();
      offListas();
    };
  }, [ativo, usuarioId, nomeDe]);

  return {
    daTarefa: useCallback((itemId: string) => tarefas.get(itemId) ?? null, [tarefas]),
    daLista: useCallback((grupoId: string) => listas.get(grupoId) ?? null, [listas]),
  };
}
