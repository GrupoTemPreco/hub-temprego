"use client";

import { useRef, useState } from "react";
import { Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

type Props = {
  /** De 0 a 1. */
  volume: number;
  onVolume: (volume: number) => void;
  onTestar: () => void;
  className?: string;
};

/** Botão de volume com um popover simples: slider e "Testar som". */
export function ControleVolume({ volume, onVolume, onTestar, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  const percentual = Math.round(volume * 100);
  const Icone = percentual === 0 ? VolumeX : percentual < 50 ? Volume1 : Volume2;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        title="Volume dos avisos"
        className={className}
      >
        <Icone className="h-3.5 w-3.5" /> {percentual}%
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-white/15 bg-[#0f172a] p-3 shadow-xl">
          <label className="block text-xs text-white/60">
            Volume dos avisos: <span className="font-medium text-white">{percentual}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percentual}
              onChange={(e) => onVolume(Number(e.target.value) / 100)}
              className="mt-2 w-full accent-blue-500"
            />
          </label>
          <button
            type="button"
            onClick={onTestar}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10"
          >
            <Play className="h-3.5 w-3.5" /> Testar som
          </button>
        </div>
      )}
    </div>
  );
}
