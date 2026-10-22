"use client";

import { LoaderCircle, X } from "lucide-react";
import { formatarTamanho } from "@/lib/format";
import type { AnexoSelecionado } from "@/hooks/useAnexos";
import { IconeArquivo } from "./IconeArquivo";

type Props = { item: AnexoSelecionado; desabilitado: boolean; onRemover: () => void };

export function AnexoSelecionadoItem({ item, desabilitado, onRemover }: Props) {
  const preparando = !item.arquivo;

  return (
    <li className="flex items-center gap-2.5 rounded-md border border-white/10 bg-white/3 p-1.5 pr-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-white/5 text-white/60">
        {item.miniatura ? (
          <img src={item.miniatura} alt="" className="h-full w-full object-cover" />
        ) : preparando ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <IconeArquivo tipo={item.tipo} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/85">{item.nome}</p>
        {item.progresso !== null ? (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${item.progresso}%` }} />
          </div>
        ) : (
          <p className="text-xs text-white/45">
            {preparando ? "Preparando..." : formatarTamanho(item.arquivo?.size ?? null)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemover}
        disabled={desabilitado}
        aria-label={`Remover ${item.nome}`}
        title="Remover"
        className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
