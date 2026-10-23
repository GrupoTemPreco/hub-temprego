"use client";

import type { ReactNode } from "react";
import { CalendarDays, Search, X } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { NIVEIS_ITEM, URGENCIAS_ITEM } from "@/lib/checklistOpcoes";
import { FILTROS_PADRAO, type FiltrosChecklist, type OrdenacaoChecklist } from "@/lib/checklistRegras";

const CAMPO = "rounded-md border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500";

const ORDENACOES: Array<{ value: OrdenacaoChecklist; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "urgencia", label: "Urgência" },
  { value: "prazo", label: "Prazo" },
];

function classePilula(ativa: boolean) {
  return `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    ativa
      ? "border-blue-500 bg-blue-600/25 text-blue-100"
      : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
  }`;
}

function alternar<T>(lista: T[], valor: T) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

type GrupoPilulasProps<T> = {
  rotulo: string;
  opcoes: Array<{ value: T; label: string }>;
  valores: T[];
  onChange: (valores: T[]) => void;
};

function GrupoPilulas<T>({ rotulo, opcoes, valores, onChange }: GrupoPilulasProps<T>) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-white/50">{rotulo}:</span>
      {opcoes.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={valores.includes(o.value)}
          onClick={() => onChange(alternar(valores, o.value))}
          className={classePilula(valores.includes(o.value))}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Props = {
  filtros: FiltrosChecklist;
  onChange: (filtros: FiltrosChecklist) => void;
  /** Botões da barra (ex.: Enviadas, Enviar tarefa, Nova lista), alinhados à direita. */
  acoes?: ReactNode;
  /** Logo depois da busca (ex.: botão "Arquivadas"). */
  aoLadoDaBusca?: ReactNode;
};

export function ChecklistFiltros({ filtros, onChange, acoes, aoLadoDaBusca }: Props) {
  const alterar = (mudancas: Partial<FiltrosChecklist>) => onChange({ ...filtros, ...mudancas });
  const temFiltro =
    filtros.busca.trim() !== "" ||
    filtros.urgencias.length > 0 ||
    filtros.niveis.length > 0 ||
    filtros.soComPrazo ||
    filtros.esconderConcluidos !== FILTROS_PADRAO.esconderConcluidos ||
    filtros.ordenacao !== FILTROS_PADRAO.ordenacao;

  return (
    <div className="mb-5 space-y-3 rounded-xl border border-white/10 bg-white/3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={filtros.busca}
            onChange={(e) => alterar({ busca: e.target.value })}
            placeholder="Buscar itens..."
            aria-label="Buscar itens"
            className={`${CAMPO} w-full pl-8`}
          />
        </label>
        {aoLadoDaBusca}
        <select
          aria-label="Ordenação"
          className={CAMPO}
          value={filtros.ordenacao}
          onChange={(e) => alterar({ ordenacao: e.target.value as OrdenacaoChecklist })}
        >
          {ORDENACOES.map((o) => (
            <option key={o.value} value={o.value}>
              Ordenar: {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={filtros.soComPrazo}
          onClick={() => alterar({ soComPrazo: !filtros.soComPrazo })}
          className={classePilula(filtros.soComPrazo)}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Só com prazo
        </button>
        <label className="flex items-center gap-2 text-sm text-white/65">
          <Toggle
            label="Esconder concluídos"
            checked={filtros.esconderConcluidos}
            onChange={(v) => alterar({ esconderConcluidos: v })}
          />
          Esconder concluídos
        </label>
        {temFiltro && (
          <button
            type="button"
            onClick={() => onChange(FILTROS_PADRAO)}
            className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </button>
        )}
        {acoes && <div className="ml-auto flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <GrupoPilulas
          rotulo="Urgência"
          opcoes={URGENCIAS_ITEM}
          valores={filtros.urgencias}
          onChange={(urgencias) => alterar({ urgencias })}
        />
        <GrupoPilulas
          rotulo="Nível"
          opcoes={NIVEIS_ITEM}
          valores={filtros.niveis}
          onChange={(niveis) => alterar({ niveis })}
        />
      </div>
    </div>
  );
}
