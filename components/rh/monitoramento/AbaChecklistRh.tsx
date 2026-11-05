"use client";

import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlocoListaLeitura } from "@/components/checklist/BlocoListaLeitura";
import type { ListasMinimizadas } from "@/components/checklist/useListasMinimizadas";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import type { ItemRh } from "@/lib/rhMonitoramento";

type Props = {
  listas: ChecklistGrupo[];
  itens: ItemRh[];
  minimizadas: ListasMinimizadas;
  selecionadoId: string | null;
  onAbrirItem: (item: ChecklistItem) => void;
};

/** Listas ativas da pessoa (as arquivadas ficam fora). A grade ignora checklist_colunas. */
export function AbaChecklistRh({ listas, itens, minimizadas, selecionadoId, onAbrirItem }: Props) {
  const ativas = listas.filter((l) => !l.arquivado).sort((a, b) => a.ordem - b.ordem);
  if (ativas.length === 0) return <EmptyState icon={ListChecks} title="Nenhuma lista ativa" compact />;

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ativas.map((lista) => {
        const minimizada = minimizadas.estaMinimizada(lista.id);
        return (
          <BlocoListaLeitura
            key={lista.id}
            lista={lista}
            itens={itens.filter((i) => i.grupo_id === lista.id)}
            minimizada={minimizada}
            onAlternarMinimizada={() => minimizadas.definir(lista.id, !minimizada)}
            onAbrirItem={onAbrirItem}
            destaqueId={selecionadoId}
          />
        );
      })}
    </div>
  );
}
