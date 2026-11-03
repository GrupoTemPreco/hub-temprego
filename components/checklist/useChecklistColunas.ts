"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { COLUNAS_PADRAO, lerChecklistColunas, limitarColunas, salvarChecklistColunas } from "@/lib/checklistColunas";

export function useChecklistColunas(usuarioId: string) {
  const toast = useToast();
  const [colunas, setColunas] = useState(COLUNAS_PADRAO);
  const pedido = useRef(0);
  const alterado = useRef(false);

  useEffect(() => {
    let ativo = true;
    lerChecklistColunas(usuarioId)
      .then((n) => {
        if (ativo && !alterado.current) setColunas(n);
      })
      .catch((err) => console.error("[checklist] Falha ao ler colunas:", err));
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  const atual = useRef(colunas);
  atual.current = colunas;

  const definir = useCallback(
    (valor: number) => {
      const n = limitarColunas(valor);
      const anterior = atual.current;
      if (n === anterior) return;
      const id = ++pedido.current;
      alterado.current = true;
      atual.current = n;
      setColunas(n);
      salvarChecklistColunas(usuarioId, n).catch((err) => {
        if (pedido.current !== id) return;
        atual.current = anterior;
        setColunas(anterior);
        console.error("[checklist] Falha ao salvar colunas:", err);
        toast.error("Não foi possível salvar o número de colunas.");
      });
    },
    [toast, usuarioId],
  );

  return { colunas, definir };
}
