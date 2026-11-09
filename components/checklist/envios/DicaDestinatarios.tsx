"use client";

import type { ReactNode } from "react";
import type { EnvioDoLote, LoteDe } from "@/lib/checklistLotes";
import { situacaoPessoaTodos } from "./textosLote";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";

type Props = {
  lote: LoteDe<EnvioDoLote>;
  cabecalho?: string;
  children: ReactNode;
  /** Modo "todos": mostra aguardando / recusou / fazendo / concluiu em dd/mm. */
  todos?: boolean;
  /** Substitui o texto de situação (ex.: progresso da lista). */
  situacaoDe?: (envio: EnvioDoLote) => string;
};

/** Dica ao passar o mouse: os destinatários do lote, com quem já recusou riscado (e o motivo). */
export function DicaDestinatarios({ lote, cabecalho, children, todos = false, situacaoDe }: Props) {
  const { nomeDe, nomeSetor, progressoDoLote } = useChecklistEnvios();
  const progresso = todos && !situacaoDe ? progressoDoLote(lote.id) : [];
  return (
    <span className="group/dica relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-40 mt-1 hidden w-60 rounded-lg border border-borda bg-superficie-forte p-2 text-left text-xs font-normal text-texto/80 shadow-xl group-hover/dica:block"
      >
        {cabecalho && <span className="mb-1 block text-texto/50">{cabecalho}</span>}
        {lote.setorId && <span className="mb-1 block text-texto/50">Setor {nomeSetor(lote.setorId)}</span>}
        <span className="block space-y-0.5">
          {lote.envios.map((e) => (
            <span key={e.id} className={`block truncate ${e.status === "recusado" ? "text-texto/45 line-through" : ""}`}>
              {nomeDe(e.para_usuario_id)}
              {situacaoDe
                ? ` — ${situacaoDe(e)}`
                : todos
                  ? ` — ${situacaoPessoaTodos(e, progresso)}`
                  : e.status === "recusado" && e.resposta
                    ? ` — ${e.resposta}`
                    : ""}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
