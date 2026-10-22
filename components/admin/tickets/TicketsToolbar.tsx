"use client";

import { useEffect, useState } from "react";
import { Columns3, List, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlteracaoUrl, VisaoTickets } from "./useTicketsUrl";

type Props = {
  q: string;
  visao: VisaoTickets;
  lixeira: boolean;
  totalLixeira: number;
  alterar: (mudancas: AlteracaoUrl) => void;
  onNovo: () => void;
};

const BOTAO_SEG = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

export function TicketsToolbar({ q, visao, lixeira, totalLixeira, alterar, onNovo }: Props) {
  const [busca, setBusca] = useState(q);

  useEffect(() => {
    if (busca === q) return;
    const timer = setTimeout(() => alterar({ q: busca }), 350);
    return () => clearTimeout(timer);
  }, [busca, q, alterar]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-55 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número ou título..."
          className="w-full rounded-md border border-white/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </label>

      <div className="flex rounded-lg border border-white/10 bg-white/3 p-1">
        {!lixeira &&
          (["lista", "kanban"] as const).map((v) => (
            <button
              key={v}
              onClick={() => alterar({ visao: v === "kanban" ? "kanban" : null })}
              className={`${BOTAO_SEG} ${visao === v ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              {v === "lista" ? <List className="h-4 w-4" /> : <Columns3 className="h-4 w-4" />}
              {v === "lista" ? "Lista" : "Kanban"}
            </button>
          ))}
        <button
          onClick={() => alterar({ lixeira: !lixeira })}
          className={`${BOTAO_SEG} ${lixeira ? "bg-rose-600/80 text-white" : "text-white/60 hover:text-white"}`}
        >
          <Trash2 className="h-4 w-4" /> Lixeira
          {totalLixeira > 0 && <span className="rounded-full bg-white/15 px-1.5 text-xs">{totalLixeira}</span>}
        </button>
      </div>

      <Button onClick={onNovo}>
        <Plus className="h-4 w-4" /> Novo ticket
      </Button>
    </div>
  );
}
