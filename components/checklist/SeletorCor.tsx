import { Check } from "lucide-react";
import { CORES_GRUPO } from "@/lib/checklistOpcoes";
import type { ChecklistCor } from "@/lib/types/shell";

type Props = { valor: ChecklistCor; onChange: (cor: ChecklistCor) => void };

export function SeletorCor({ valor, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Cor da lista" className="flex flex-wrap gap-2">
      {CORES_GRUPO.map((cor) => {
        const ativa = cor.value === valor;
        return (
          <button
            key={cor.value}
            type="button"
            role="radio"
            aria-checked={ativa}
            aria-label={cor.label}
            title={cor.label}
            onClick={() => onChange(cor.value)}
            className={`flex h-6 w-6 items-center justify-center rounded-full ${cor.classe} transition-transform hover:scale-110 ${
              ativa ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b1224]" : ""
            }`}
          >
            {ativa && <Check className="h-3.5 w-3.5 text-black/70" />}
          </button>
        );
      })}
    </div>
  );
}
