"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { situacaoRecorrencia, type RepeticaoLista } from "@/lib/checklistDiarias";
import type { ChecklistItem } from "@/lib/types/shell";
import { ItemConteudo } from "./ItemLinha";

type Props = {
  itens: ChecklistItem[];
  /** Grupo compartilhado só para leitura: sem "Reabrir". */
  somenteLeitura: boolean;
  autorDe: (item: ChecklistItem) => string | undefined;
  onAbrir: (item: ChecklistItem) => void;
  onReabrir: (item: ChecklistItem) => void;
  onAlternarFixado: (item: ChecklistItem) => void;
  repeticaoLista?: RepeticaoLista | null;
  destaqueId?: string | null;
};

export function ConcluidosSecao({
  itens,
  somenteLeitura,
  autorDe,
  onAbrir,
  onReabrir,
  onAlternarFixado,
  repeticaoLista = null,
  destaqueId = null,
}: Props) {
  const [aberto, setAberto] = useState(false);
  if (itens.length === 0) return null;

  return (
    <div className="border-t border-borda">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-texto-suave hover:text-texto"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-90" : ""}`} />
        Concluídos ({itens.length})
      </button>
      {aberto && (
        <ul className="divide-y divide-borda">
          {itens.map((item) => (
            <li key={item.id} className={item.id === destaqueId ? "bg-blue-500/10" : undefined}>
              <ItemConteudo
                item={item}
                somenteLeitura={somenteLeitura}
                autor={autorDe(item)}
                onAbrir={() => onAbrir(item)}
                onAlternarFeito={() => onReabrir(item)}
                onAlternarFixado={() => onAlternarFixado(item)}
                repeticaoLista={repeticaoLista}
                acaoExtra={
                  !somenteLeitura &&
                  situacaoRecorrencia(item)?.tipo !== "sem_ocorrencia" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReabrir(item);
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-texto-suave hover:bg-superficie-hover hover:text-texto"
                    >
                      <RotateCcw className="h-3 w-3" /> Reabrir
                    </button>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
