"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { OptionList, SeloOpcao, type Opcao } from "./OptionList";

type ChipsSelectProps = {
  opcoes: Opcao[];
  values: string[];
  onChange: (values: string[]) => void;
  /** Rótulo dos valores selecionados que não estão entre as opções. */
  labelDe?: (value: string) => string;
  adicionarLabel?: string;
  vazio?: string;
};

export function ChipsSelect({
  opcoes,
  values,
  onChange,
  labelDe,
  adicionarLabel = "Adicionar",
  vazio = "Nenhum usuário disponível.",
}: ChipsSelectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  function fechar() {
    setAberto(false);
    setBusca("");
  }

  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  const rotulo = (v: string) => opcoes.find((o) => o.value === v)?.label ?? labelDe?.(v) ?? v;
  const selo = (v: string) => opcoes.find((o) => o.value === v)?.selo;
  const disponiveis = opcoes.filter((o) => !values.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <div className="flex min-h-10.5 flex-wrap items-center gap-1.5 rounded-md border border-white/10 bg-(--input-bg) p-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-600/20 py-0.5 pl-2.5 pr-1 text-xs text-blue-100"
          >
            {rotulo(v)}
            {selo(v) && <SeloOpcao texto={selo(v)!} />}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remover ${rotulo(v)}`}
              className="rounded-full p-0.5 hover:bg-white/15"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => (aberto ? fechar() : setAberto(true))}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white/55 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> {adicionarLabel}
        </button>
      </div>

      {aberto && (
        <OptionList
          opcoes={disponiveis}
          busca={busca}
          onBusca={setBusca}
          vazio={vazio}
          onEscolher={(v) => {
            onChange([...values, v]);
            setBusca("");
          }}
        />
      )}
    </div>
  );
}
