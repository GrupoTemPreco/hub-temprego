"use client";

import { DIAS_SEMANA, normalizarDias } from "@/lib/checklistDiarias";
import type { ChecklistItem } from "@/lib/types/shell";
import { CAMPO, Campo } from "./Campos";

export type ModoRepetir = "nao" | "todo_dia" | "dias";
export type Repeticao = { modo: ModoRepetir; dias: number[] };

const OPCOES: Array<{ value: ModoRepetir; label: string }> = [
  { value: "nao", label: "Não repete" },
  { value: "todo_dia", label: "Todo dia" },
  { value: "dias", label: "Dias da semana" },
];

/** Sugestão ao trocar para "Dias da semana" pela primeira vez: seg a sex. */
const DIAS_INICIAIS = [1, 2, 3, 4, 5];

export function repeticaoDe(item: Pick<ChecklistItem, "diaria" | "dias_semana">): Repeticao {
  const dias = normalizarDias(item.dias_semana);
  if (!item.diaria) return { modo: "nao", dias: DIAS_INICIAIS };
  return dias ? { modo: "dias", dias } : { modo: "todo_dia", dias: DIAS_INICIAIS };
}

/** Campos gravados: os 7 dias marcados viram null ("todo dia"). */
export function camposDaRepeticao(r: Repeticao): Pick<ChecklistItem, "diaria" | "dias_semana"> {
  if (r.modo === "nao") return { diaria: false, dias_semana: null };
  if (r.modo === "todo_dia") return { diaria: true, dias_semana: null };
  return { diaria: true, dias_semana: normalizarDias(r.dias) };
}

export const repeticaoValida = (r: Repeticao) => r.modo !== "dias" || r.dias.length > 0;

type Props = {
  valor: Repeticao;
  onChange: (valor: Repeticao) => void;
  /** Dentro de lista diária a tarefa sempre repete: sem "Não repete". */
  sempreRepete?: boolean;
  disabled?: boolean;
  /** Substitui o texto de apoio (ex.: repetição da lista inteira). */
  dica?: string;
};

export function CampoRepetir({ valor, onChange, sempreRepete = false, disabled = false, dica }: Props) {
  const opcoes = sempreRepete ? OPCOES.filter((o) => o.value !== "nao") : OPCOES;

  function alternarDia(dia: number) {
    const dias = valor.dias.includes(dia) ? valor.dias.filter((d) => d !== dia) : [...valor.dias, dia];
    onChange({ ...valor, dias: dias.sort((a, b) => a - b) });
  }

  return (
    <div className="space-y-2 rounded-lg border border-borda p-3">
      <Campo rotulo="Repetir">
        <select
          className={`${CAMPO} disabled:cursor-not-allowed disabled:opacity-50`}
          value={valor.modo}
          disabled={disabled}
          onChange={(e) => onChange({ ...valor, modo: e.target.value as ModoRepetir })}
        >
          {opcoes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Campo>
      {valor.modo === "dias" && (
        <div className="space-y-1">
          <div role="group" aria-label="Dias da semana" className="flex flex-wrap gap-1.5">
            {DIAS_SEMANA.map((d) => {
              const marcado = valor.dias.includes(d.valor);
              return (
                <button
                  key={d.valor}
                  type="button"
                  title={d.nome}
                  aria-label={d.nome}
                  aria-pressed={marcado}
                  disabled={disabled}
                  onClick={() => alternarDia(d.valor)}
                  className={`h-8 w-8 rounded-full border text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    marcado
                      ? "border-blue-500 bg-blue-600/30 text-blue-100"
                      : "border-borda bg-superficie text-texto/60 hover:bg-superficie-hover hover:text-texto"
                  }`}
                >
                  {d.letra}
                </button>
              );
            })}
          </div>
          {valor.dias.length === 0 && <p className="text-xs text-rose-300">Marque pelo menos um dia.</p>}
        </div>
      )}
      <p className="text-xs text-texto/50">
        {dica ??
          (sempreRepete
          ? "A lista já repete; você pode escolher dias diferentes para esta tarefa."
          : valor.modo === "nao"
            ? "Fica concluída depois de marcada."
            : "Volta pendente no próximo dia programado. Desligar mantém o histórico.")}
      </p>
    </div>
  );
}
