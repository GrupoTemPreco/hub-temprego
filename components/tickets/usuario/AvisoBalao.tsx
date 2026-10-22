"use client";

import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AvisoTickets } from "./useAvisosTickets";

type Props = {
  aviso: AvisoTickets;
  /** Abre o ticket (ou o balão em Recebidos) e dispensa o aviso. */
  onAbrir: () => void;
  /** Só dispensa o aviso ("Ok" e X). */
  onDispensar: () => void;
};

/** Cartão pequeno logo acima do balão, com a setinha apontando para ele. */
export function AvisoBalao({ aviso, onAbrir, onDispensar }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-23 right-5 z-30 w-72 max-w-[calc(100vw-2.5rem)] motion-safe:animate-surgir"
    >
      <div className="relative rounded-xl border border-blue-400/40 bg-[#0b1224] shadow-2xl">
        <div className="flex items-start gap-2.5 p-3 pr-9">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
            <MessageSquare className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">{aviso.titulo}</span>
            {aviso.detalhe && (
              <span className={`mt-0.5 block text-xs text-white/60 ${aviso.detalheCortado ? "truncate" : ""}`}>
                {aviso.detalhe}
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <Button size="sm" variant="secondary" onClick={onDispensar}>
            Ok
          </Button>
          <Button size="sm" onClick={onAbrir}>
            Abrir
          </Button>
        </div>
        <button
          type="button"
          onClick={onDispensar}
          aria-label="Dispensar aviso"
          className="absolute right-1.5 top-1.5 rounded p-1 text-white/45 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span
          aria-hidden
          className="absolute -bottom-1.5 right-5.5 h-3 w-3 rotate-45 border-b border-r border-blue-400/40 bg-[#0b1224]"
        />
      </div>
    </div>
  );
}
