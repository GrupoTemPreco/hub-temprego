"use client";

import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlocoListaLeitura } from "@/components/checklist/BlocoListaLeitura";
import type { ChecklistGrupo } from "@/lib/types/shell";
import type { ItemRh } from "@/lib/rhMonitoramento";

/** Listas ativas da pessoa (as arquivadas ficam fora); concluídos aparecem recolhidos. */
export function AbaChecklistRh({ listas, itens }: { listas: ChecklistGrupo[]; itens: ItemRh[] }) {
  const ativas = listas.filter((l) => !l.arquivado).sort((a, b) => a.ordem - b.ordem);
  if (ativas.length === 0) return <EmptyState icon={ListChecks} title="Nenhuma lista ativa" compact />;

  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {ativas.map((lista) => (
        <BlocoListaLeitura key={lista.id} lista={lista} itens={itens.filter((i) => i.grupo_id === lista.id)} />
      ))}
    </div>
  );
}
