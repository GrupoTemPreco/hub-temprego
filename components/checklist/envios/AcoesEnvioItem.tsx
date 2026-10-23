"use client";

import { createContext, useContext } from "react";
import type { LoteEnvio, SituacaoEnvioItem } from "@/lib/checklistLotes";
import type { ChecklistItem } from "@/lib/types/shell";

/** Ações de envio que as linhas e o Drawer do item disparam; os modais ficam na página. */
export type AcoesEnvioItem = {
  situacao: (item: ChecklistItem) => SituacaoEnvioItem | null;
  enviar: (item: ChecklistItem) => void;
  /** Pede confirmação e cancela todos os pendentes do lote. */
  cancelar: (lote: LoteEnvio) => void;
};

export const AcoesEnvioItemContext = createContext<AcoesEnvioItem | null>(null);

export function useAcoesEnvioItem() {
  return useContext(AcoesEnvioItemContext);
}
