import { AlertTriangle, CheckCircle2, Clock, ListChecks, Users } from "lucide-react";
import { StatCard } from "@/components/admin/visao-geral/StatCard";
import { formatarHoras, formatarPercentual, type TotaisRh } from "@/lib/rhRegras";

/** Cinco números do topo; no celular ficam em 2 colunas e o último ocupa a linha toda. */
export function NumerosRh({ totais, dias }: { totais: TotaisRh; dias: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        titulo="Usando o checklist"
        valor={`${totais.usandoChecklist}/${totais.total}`}
        legenda="Abriram nos últimos 7 dias"
        icon={Users}
        cor="blue"
      />
      <StatCard titulo="Tarefas pendentes" valor={totais.pendentes} legenda="Somando todos" icon={ListChecks} cor="cyan" />
      <StatCard
        titulo="Tarefas vencidas"
        valor={totais.vencidos}
        legenda={totais.vencidos > 0 ? "Prazo já passou" : "Nenhuma vencida"}
        icon={AlertTriangle}
        cor="red"
      />
      <StatCard
        titulo="Entregues no prazo"
        valor={formatarPercentual(totais.noPrazo)}
        legenda={`Nos últimos ${dias} dias`}
        icon={CheckCircle2}
        cor="green"
      />
      <div className="col-span-2 lg:col-span-1">
        <StatCard
          titulo="Tempo médio de entrega"
          valor={formatarHoras(totais.tempoMedioHoras)}
          legenda="Do início à conclusão"
          icon={Clock}
          cor="cyan"
        />
      </div>
    </div>
  );
}
