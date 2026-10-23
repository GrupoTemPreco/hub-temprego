import { tempoRelativo } from "@/lib/format";
import { DIAS_SEM_CHECKLIST, fracaoNoPrazo, formatarPercentual } from "@/lib/rhRegras";
import type { ResumoUsuarioRh } from "@/lib/rhMonitoramento";

const DIA_MS = 86_400_000;

/** "há 2 dias"; em vermelho acima de 7 dias (quando `alertar`) e "Nunca" quando nulo. */
export function AcessoRelativo({ iso, agora, alertar = false }: { iso: string | null; agora: number; alertar?: boolean }) {
  if (!iso) return <span className={alertar ? "text-rose-300" : "text-white/45"}>Nunca</span>;
  const antigo = alertar && agora - new Date(iso).getTime() > DIAS_SEM_CHECKLIST * DIA_MS;
  return <span className={antigo ? "text-rose-300" : "text-white/70"}>{tempoRelativo(iso, new Date(agora))}</span>;
}

/** Número que fica vermelho quando maior que zero (críticos, vencidos). */
export function NumeroAlerta({ valor }: { valor: number }) {
  return <span className={valor > 0 ? "font-semibold text-rose-300" : "text-white/60"}>{valor}</span>;
}

/** "—" com menos de 5 tarefas com prazo concluídas no período. */
export function PercentualPrazo({ usuario }: { usuario: ResumoUsuarioRh }) {
  const fracao = fracaoNoPrazo(usuario);
  if (fracao === null) {
    return (
      <span className="cursor-help text-white/40" title="Poucas tarefas com prazo para calcular">
        —
      </span>
    );
  }
  return <span className={fracao < 0.5 ? "text-amber-300" : "text-white/80"}>{formatarPercentual(fracao)}</span>;
}

export function SetoresChips({ setores }: { setores: string[] }) {
  if (setores.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {setores.map((s) => (
        <span key={s} className="rounded-full bg-white/10 px-1.5 py-px text-[11px] text-white/70">
          {s}
        </span>
      ))}
    </span>
  );
}
