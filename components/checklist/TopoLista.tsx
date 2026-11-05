"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/** Clique aqui não recolhe a lista (menu, selo, alça, edição do nome). */
export const ignorarRecolher = { "data-ignorar-recolher": "" } as const;

export function cliqueRecolheLista(evento: MouseEvent) {
  const alvo = evento.target;
  if (!(alvo instanceof Element)) return false;
  if (alvo.closest("[data-ignorar-recolher], input, textarea, select")) return false;
  return true;
}

export function contagemLista(pendentes: number, feitas: number) {
  const pendente = pendentes === 1 ? "1 pendente" : `${pendentes} pendentes`;
  const feita = feitas === 1 ? "1 feita" : `${feitas} feitas`;
  return `${pendente} · ${feita}`;
}

type Props = {
  children: ReactNode;
  /** Sem callback, a faixa só mostra o conteúdo (ex.: lista já dentro de outro acordeão). */
  onAlternar?: () => void;
  minimizada?: boolean;
  className?: string;
};

/** Faixa do nome. O mouseDown precisa ter começado nela: um modal que fecha no meio do clique não recolhe. */
export function TopoLista({ children, onAlternar, minimizada = false, className = "" }: Props) {
  const pressionouNaFaixa = useRef(false);
  const faixa = `flex items-center px-3 py-2 ${className || "gap-1.5"}`;

  if (!onAlternar) {
    return <header className={`${faixa} border-b border-white/10`}>{children}</header>;
  }

  function aoPressionar(evento: MouseEvent<HTMLElement>) {
    pressionouNaFaixa.current = cliqueRecolheLista(evento);
  }

  function aoClicar(evento: MouseEvent<HTMLElement>) {
    const comecouAqui = pressionouNaFaixa.current;
    pressionouNaFaixa.current = false;
    if (!comecouAqui || !cliqueRecolheLista(evento)) return;
    onAlternar?.();
  }

  return (
    <header
      onMouseDown={aoPressionar}
      onClick={aoClicar}
      className={`${faixa} cursor-pointer ${minimizada ? "" : "border-b border-white/10"}`}
    >
      <button
        type="button"
        aria-expanded={!minimizada}
        aria-label={minimizada ? "Expandir lista" : "Minimizar lista"}
        {...ignorarRecolher}
        onMouseDown={(evento) => evento.stopPropagation()}
        onClick={(evento) => {
          evento.stopPropagation();
          onAlternar();
        }}
        className="shrink-0 rounded p-0.5 text-white/45 hover:bg-white/10 hover:text-white"
      >
        <ChevronRight className={`h-4 w-4 transition-transform ${minimizada ? "" : "rotate-90"}`} />
      </button>
      {children}
    </header>
  );
}
