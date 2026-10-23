"use client";

import type { ComponentType } from "react";
import { ChevronRight, Pin } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

/** Botão ao lado da linha: desfixar (itens fixados) ou "Ok" (aceites ainda não vistos). */
export type AcaoLateral = { tipo: "desfixar" | "ok"; onClick: () => void; desabilitado?: boolean; dica?: string };

export type LinhaAtencaoDados = {
  id: string;
  icone: ComponentType<{ className?: string }>;
  /** Classes de fundo e cor do ícone. */
  cor: string;
  texto: string;
  detalhe?: string;
  chip: { texto: string; cor: BadgeVariant };
  onAbrir: () => void;
  acao?: AcaoLateral;
};

export function LinhaAtencao({ linha }: { linha: LinhaAtencaoDados }) {
  const { icone: Icon, cor, texto, detalhe, chip, onAbrir, acao } = linha;
  return (
    <li className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/2 transition-colors hover:bg-white/6">
      <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white/90">{texto}</span>
          {detalhe && <span className="block truncate text-xs text-white/50">{detalhe}</span>}
        </span>
        <Badge variant={chip.cor} className="shrink-0">
          {chip.texto}
        </Badge>
        {!acao && <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />}
      </button>
      {acao?.tipo === "desfixar" && (
        <button
          type="button"
          onClick={acao.onClick}
          disabled={acao.desabilitado}
          title={acao.dica ?? "Desafixar"}
          aria-label="Desafixar item"
          className="mr-1.5 shrink-0 rounded p-1.5 text-amber-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pin className="h-4 w-4 fill-current" />
        </button>
      )}
      {acao?.tipo === "ok" && (
        <button
          type="button"
          onClick={acao.onClick}
          title={acao.dica ?? "Ok, já vi"}
          className="mr-1.5 shrink-0 rounded-md border border-white/15 px-2 py-1 text-xs font-medium text-white/80 hover:bg-white/10"
        >
          Ok
        </button>
      )}
    </li>
  );
}
