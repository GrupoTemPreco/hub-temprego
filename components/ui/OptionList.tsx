"use client";

import { Search } from "lucide-react";
import { CHIP } from "./Badge";

export type Opcao = { value: string; label: string; sublabel?: string | null; selo?: string | null };

export function SeloOpcao({ texto }: { texto: string }) {
  return (
    <span className={`rounded border px-1 py-px text-[10px] font-medium uppercase tracking-wide ${CHIP.warning}`}>
      {texto}
    </span>
  );
}

export function filtrarOpcoes(opcoes: Opcao[], termo: string) {
  const t = termo.trim().toLowerCase();
  if (!t) return opcoes;
  return opcoes.filter((o) => o.label.toLowerCase().includes(t) || (o.sublabel ?? "").toLowerCase().includes(t));
}

type OptionListProps = {
  opcoes: Opcao[];
  busca: string;
  onBusca: (valor: string) => void;
  onEscolher: (value: string) => void;
  selecionado?: string | null;
  vazio?: string;
};

/** Painel flutuante com campo de busca e lista de opções, usado por Combobox e ChipsSelect. */
export function OptionList({ opcoes, busca, onBusca, onEscolher, selecionado, vazio = "Nada encontrado." }: OptionListProps) {
  const visiveis = filtrarOpcoes(opcoes, busca);

  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-borda bg-superficie-forte shadow-xl">
      <label className="relative block border-b border-borda">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto/40" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-transparent py-2 pl-9 pr-3 text-sm outline-none"
        />
      </label>
      <ul className="max-h-52 overflow-y-auto py-1">
        {visiveis.length === 0 && <li className="px-3 py-2 text-sm text-texto/45">{vazio}</li>}
        {visiveis.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onEscolher(o.value)}
              className={`flex w-full flex-col px-3 py-1.5 text-left text-sm hover:bg-superficie-hover ${
                o.value === selecionado ? "bg-blue-600/20 text-blue-200" : "text-texto/85"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {o.label}
                {o.selo && <SeloOpcao texto={o.selo} />}
              </span>
              {o.sublabel && <span className="text-xs text-texto/45">{o.sublabel}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
