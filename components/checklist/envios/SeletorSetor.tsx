"use client";

import { Building2, Check } from "lucide-react";
import type { SetorChecklist } from "@/lib/checklistEnvios";

type Props = { setores: SetorChecklist[]; valor: string | null; onChange: (id: string) => void };

/** Setores ativos com quantas pessoas receberiam; setores sem ninguém ficam desabilitados. */
export function SeletorSetor({ setores, valor, onChange }: Props) {
  if (setores.length === 0) return <p className="text-sm text-white/45">Nenhum setor ativo.</p>;

  return (
    <ul role="radiogroup" aria-label="Setor" className="max-h-52 overflow-y-auto rounded-md border border-white/10 py-1">
      {setores.map((s) => {
        const total = s.destinatarios.length;
        const ativo = s.id === valor;
        return (
          <li key={s.id}>
            <button
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={total === 0}
              onClick={() => onChange(s.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                ativo ? "bg-blue-600/20 text-blue-100" : "text-white/85"
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0 text-white/45" />
              <span className="min-w-0 flex-1 truncate">{s.nome}</span>
              <span className="shrink-0 text-xs text-white/50">
                {total} {total === 1 ? "pessoa" : "pessoas"}
              </span>
              {ativo && <Check className="h-4 w-4 shrink-0 text-blue-300" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
