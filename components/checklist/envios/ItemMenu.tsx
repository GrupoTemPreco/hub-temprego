"use client";

import { useRef, useState } from "react";
import { Ban, Check, MoreHorizontal, Send } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { SituacaoEnvioItem } from "@/lib/checklistLotes";
import type { ChecklistItem } from "@/lib/types/shell";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { useAcoesEnvioItem } from "./AcoesEnvioItem";
import { BotaoReenviar } from "./BotaoReenviar";

const OPCAO = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/10";

type Props = { item: ChecklistItem; situacao: SituacaoEnvioItem | null };

/** Menu "⋯" da linha: enviar, ou reenviar/cancelar enquanto aguarda resposta. */
export function ItemMenu({ item, situacao }: Props) {
  const acoes = useAcoesEnvioItem();
  const { marcarCiente } = useChecklistEnvios();
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);
  if (!acoes) return null;

  const aguardando = situacao?.tipo === "aguardando";

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Mais ações do item"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="rounded p-1 text-white/35 transition-colors hover:bg-white/10 hover:text-white/80"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 space-y-0.5 rounded-lg border border-white/15 bg-[#0f172a] p-1.5 shadow-xl">
          {aguardando ? (
            <>
              <BotaoReenviar lote={situacao.lote} className={`${OPCAO} text-white/85`} onFeito={fechar} />
              <button
                type="button"
                className={`${OPCAO} text-rose-300 hover:bg-rose-500/10`}
                onClick={() => {
                  fechar();
                  acoes.cancelar(situacao.lote);
                }}
              >
                <Ban className="h-3.5 w-3.5" /> Cancelar envio
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${OPCAO} text-white/85`}
                onClick={() => {
                  fechar();
                  acoes.enviar(item);
                }}
              >
                <Send className="h-3.5 w-3.5" /> Enviar para…
              </button>
              {situacao?.tipo === "recusado" && (
                <button
                  type="button"
                  className={`${OPCAO} text-white/85`}
                  onClick={() => {
                    fechar();
                    void marcarCiente(situacao.lote);
                  }}
                >
                  <Check className="h-3.5 w-3.5" /> Ok, ciente da recusa
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
