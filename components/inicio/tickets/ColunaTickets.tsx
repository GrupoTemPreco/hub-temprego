import type { ReactNode } from "react";
import { ContadorNovidades } from "@/components/tickets/usuario/ContadorNovidades";

type Props = {
  titulo: string;
  total: number;
  novidades: number;
  vazio: string;
  children: ReactNode;
};

/** Coluna de altura fixa: título com contador parado e lista com rolagem interna. */
export function ColunaTickets({ titulo, total, novidades, vazio, children }: Props) {
  return (
    <div className="flex h-95 min-w-0 flex-col rounded-xl border border-white/10 bg-white/2">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-3">
        <h3 className="font-semibold text-white">{titulo}</h3>
        <span className="rounded-full bg-white/10 px-2 text-xs text-white/70">{total}</span>
        <ContadorNovidades total={novidades} />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {total === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/45">{vazio}</p>
        )}
        {children}
      </div>
    </div>
  );
}
