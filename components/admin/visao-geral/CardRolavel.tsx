import type { ReactNode, UIEvent } from "react";

type Props = {
  titulo: ReactNode;
  children: ReactNode;
  onRolar?: (e: UIEvent<HTMLDivElement>) => void;
};

/** Card de altura fixa: o cabeçalho fica parado e só o conteúdo rola. */
export function CardRolavel({ titulo, children, onRolar }: Props) {
  return (
    <section className="flex h-105 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/3">
      <h2 className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-3 font-semibold">{titulo}</h2>
      <div className="min-h-0 flex-1 overflow-y-auto p-4" onScroll={onRolar}>
        {children}
      </div>
    </section>
  );
}
