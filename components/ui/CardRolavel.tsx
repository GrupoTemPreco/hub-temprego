import type { ReactNode, UIEvent } from "react";
import { Button } from "./Button";

/**
 * "360": linha de três cards (altura fixa a partir do tablet; no celular, a do conteúdo até 360px).
 * "420": linha de dois cards largos (altura fixa a partir do desktop).
 */
export type AlturaCard = "360" | "420";

const ALTURAS: Record<AlturaCard, string> = {
  "360": "max-h-90 md:h-90",
  "420": "max-h-105 lg:h-105",
};

type Props = {
  titulo: ReactNode;
  /** Botão no canto direito do cabeçalho (ex.: "Abrir checklist"). */
  acao?: ReactNode;
  altura?: AlturaCard;
  children: ReactNode;
  onRolar?: (e: UIEvent<HTMLDivElement>) => void;
};

/** Card com cabeçalho fixo e conteúdo com rolagem interna. */
export function CardRolavel({ titulo, acao, altura = "420", children, onRolar }: Props) {
  return (
    <section className={`flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/3 ${ALTURAS[altura]}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 font-semibold">{titulo}</h2>
        {acao}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4" onScroll={onRolar}>
        {children}
      </div>
    </section>
  );
}

/** Botão do cabeçalho dos cards do Início ("Abrir checklist", "Abrir ticket"), sempre no mesmo estilo. */
export function AcaoCard({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClick} className="shrink-0">
      {children}
    </Button>
  );
}

/** Estado vazio compacto e centralizado, para dentro de um CardRolavel. */
export function VazioCard({ children }: { children: ReactNode }) {
  return <p className="flex h-full min-h-16 items-center justify-center text-center text-sm text-white/45">{children}</p>;
}

/** Contador ao lado do título do card. */
export function TotalCard({ total }: { total: number }) {
  return <span className="rounded-full bg-white/10 px-2 text-xs font-medium text-white/70">{total}</span>;
}
