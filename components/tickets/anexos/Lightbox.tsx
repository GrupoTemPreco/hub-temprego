"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export type ImagemLightbox = { id: string; url: string; nome: string };

type Props = {
  imagens: ImagemLightbox[];
  indice: number;
  onNavegar: (indice: number) => void;
  onFechar: () => void;
};

const BOTAO = "rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white";

export function Lightbox({ imagens, indice, onNavegar, onFechar }: Props) {
  useEscapeKey(true, onFechar);
  const total = imagens.length;
  const atual = imagens[indice];

  useEffect(() => {
    function navegarPorTeclado(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") onNavegar((indice - 1 + total) % total);
      if (e.key === "ArrowRight") onNavegar((indice + 1) % total);
    }
    window.addEventListener("keydown", navegarPorTeclado);
    return () => window.removeEventListener("keydown", navegarPorTeclado);
  }, [indice, total, onNavegar]);

  if (!atual) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={atual.nome}
      className="fixed inset-0 z-55 flex flex-col bg-black/90"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-white/80">
        <span className="min-w-0 truncate">{atual.nome}</span>
        <span className="flex shrink-0 items-center gap-3">
          {total > 1 && (
            <span className="text-white/50">
              {indice + 1} / {total}
            </span>
          )}
          <button onClick={onFechar} aria-label="Fechar" className={BOTAO}>
            <X className="h-5 w-5" />
          </button>
        </span>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-16 pb-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onFechar();
        }}
      >
        <img src={atual.url} alt={atual.nome} className="max-h-full max-w-full object-contain" />
        {total > 1 && (
          <>
            <button
              onClick={() => onNavegar((indice - 1 + total) % total)}
              aria-label="Imagem anterior"
              className={`${BOTAO} absolute left-4`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => onNavegar((indice + 1) % total)}
              aria-label="Próxima imagem"
              className={`${BOTAO} absolute right-4`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
