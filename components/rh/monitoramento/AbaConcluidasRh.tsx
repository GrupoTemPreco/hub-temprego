import { CheckCircle2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatarDataHoraSP } from "@/lib/datas";
import { concluidasNoPeriodo, formatarHoras, horasEntre, situacaoEntrega, type SituacaoEntrega } from "@/lib/rhRegras";
import type { ChecklistGrupo } from "@/lib/types/shell";
import type { ItemRh } from "@/lib/rhMonitoramento";

const CHIP: Record<SituacaoEntrega, { texto: string; cor: BadgeVariant }> = {
  "no-prazo": { texto: "No prazo", cor: "success" },
  atrasada: { texto: "Atrasada", cor: "danger" },
  "sem-prazo": { texto: "Sem prazo", cor: "neutral" },
};

type Props = { listas: ChecklistGrupo[]; itens: ItemRh[]; dias: number; agora: number };

/** Concluídas no período: início (aceite ou criação), conclusão, duração e se foi no prazo. */
export function AbaConcluidasRh({ listas, itens, dias, agora }: Props) {
  const concluidas = concluidasNoPeriodo(itens, dias, agora);
  const nomeLista = (id: string) => listas.find((l) => l.id === id)?.nome ?? "—";
  if (concluidas.length === 0) {
    return <EmptyState icon={CheckCircle2} title={`Nenhuma tarefa concluída nos últimos ${dias} dias`} compact />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-2.5 font-medium">Tarefa</th>
            <th className="px-3 py-2.5 font-medium">Lista</th>
            <th className="px-3 py-2.5 font-medium">Início</th>
            <th className="px-3 py-2.5 font-medium">Conclusão</th>
            <th className="px-3 py-2.5 text-right font-medium">Duração</th>
            <th className="px-3 py-2.5 font-medium">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {concluidas.map((item) => {
            const chip = CHIP[situacaoEntrega(item)];
            return (
              <tr key={item.id} className="border-b border-white/5">
                <td className="max-w-64 truncate px-3 py-2.5 font-medium text-white/90">{item.titulo}</td>
                <td className="px-3 py-2.5 text-white/65">{nomeLista(item.grupo_id)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-white/60">{formatarDataHoraSP(item.inicio_em)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-white/60">{formatarDataHoraSP(item.concluido_em)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-white/70">
                  {formatarHoras(horasEntre(item.inicio_em, item.concluido_em))}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={chip.cor}>{chip.texto}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
