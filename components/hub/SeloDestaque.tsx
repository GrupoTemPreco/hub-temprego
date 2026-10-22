import { estiloCor } from "@/lib/destaques";
import type { DestaqueCor } from "@/lib/types/shell";

export function SeloDestaque({ texto, cor, className = "" }: { texto: string; cor: DestaqueCor; className?: string }) {
  return (
    <span
      className={`pointer-events-none shrink-0 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white ${
        estiloCor(cor).selo
      } ${className}`}
    >
      {texto}
    </span>
  );
}

export function PontoDestaque({ cor, className = "" }: { cor: DestaqueCor; className?: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${estiloCor(cor).ponto} ${className}`} />;
}
