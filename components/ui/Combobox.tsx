"use client";

import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { OptionList, type Opcao } from "./OptionList";

type ComboboxProps = {
  opcoes: Opcao[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Rótulo exibido quando o valor atual não está entre as opções. */
  labelFallback?: string;
};

export function Combobox({ opcoes, value, onChange, placeholder = "Selecione...", labelFallback }: ComboboxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  function fechar() {
    setAberto(false);
    setBusca("");
  }

  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  const selecionada = opcoes.find((o) => o.value === value);
  const rotulo = selecionada?.label ?? (value ? labelFallback ?? "Usuário" : null);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center rounded-md border border-white/10 bg-(--input-bg) focus-within:border-blue-500">
        <button
          type="button"
          onClick={() => (aberto ? fechar() : setAberto(true))}
          className="flex flex-1 items-center justify-between gap-2 px-3 py-2 text-left text-sm"
        >
          <span className={rotulo ? "text-white" : "text-white/45"}>{rotulo ?? placeholder}</span>
          <ChevronDown className="h-4 w-4 text-white/40" />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Limpar seleção"
            className="mr-1 rounded p-1 text-white/45 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {aberto && (
        <OptionList
          opcoes={opcoes}
          busca={busca}
          onBusca={setBusca}
          selecionado={value}
          onEscolher={(v) => {
            onChange(v);
            fechar();
          }}
        />
      )}
    </div>
  );
}
