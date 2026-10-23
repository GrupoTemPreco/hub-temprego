"use client";

import { useRef, useState } from "react";
import { Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSom } from "@/components/hub/SomNotificacaoProvider";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const BOTAO =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45";

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Só para admin: volume dos avisos para ele mesmo ou para todos. */
export function ControleVolume({ className = "" }: { className?: string }) {
  const toast = useToast();
  const som = useSom();
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(som.volume);
  const [salvando, setSalvando] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  const Icone = som.volume === 0 ? VolumeX : som.volume < 0.5 ? Volume1 : Volume2;

  async function salvar(acao: () => Promise<void>, sucesso: string) {
    setSalvando(true);
    try {
      await acao();
      toast.success(sucesso);
      fechar();
    } catch (err) {
      toast.error(`Não foi possível salvar o volume: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setRascunho(som.volume);
          setAberto((v) => !v);
        }}
        aria-expanded={aberto}
        title="Volume dos avisos"
        className={className}
      >
        <Icone className="h-3.5 w-3.5" /> {pct(som.volume)}
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 space-y-2 rounded-lg border border-white/15 bg-[#0f172a] p-3 shadow-xl">
          <label className="block text-xs text-white/60">
            Volume dos avisos: <span className="font-medium text-white">{pct(rascunho)}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(rascunho * 100)}
              onChange={(e) => setRascunho(Number(e.target.value) / 100)}
              className="mt-2 w-full accent-blue-500"
            />
          </label>
          <p className="text-[11px] text-white/45">
            Todos: {pct(som.volumeGlobal)} · Você:{" "}
            {som.volumePessoal === null ? "usa o de todos" : `${pct(som.volumePessoal)} (pessoal)`}
          </p>
          <button type="button" onClick={() => som.testar(rascunho)} className={BOTAO}>
            <Play className="h-3.5 w-3.5" /> Testar som
          </button>
          <div className="grid gap-1.5 border-t border-white/10 pt-2">
            <button
              type="button"
              disabled={salvando}
              className={BOTAO}
              onClick={() => salvar(() => som.salvarParaMim(rascunho), `Seu volume ficou em ${pct(rascunho)}.`)}
            >
              Salvar só para mim
            </button>
            <button
              type="button"
              disabled={salvando}
              className={`${BOTAO} border-blue-500/40 bg-blue-600/20 text-blue-100 hover:bg-blue-600/30`}
              onClick={() => salvar(() => som.salvarParaTodos(rascunho), `Volume de todos em ${pct(rascunho)}.`)}
            >
              Salvar para todos
            </button>
            <button
              type="button"
              disabled={salvando || som.volumePessoal === null}
              className={BOTAO}
              onClick={() => salvar(som.usarPadrao, "Você voltou a usar o volume de todos.")}
            >
              Usar o padrão de todos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
