"use client";

import type { ReactNode } from "react";
import type { LoteEnvio } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";

type Props = { lote: LoteEnvio; cabecalho?: string; children: ReactNode };

/** Dica ao passar o mouse: os destinatários do lote, com quem já recusou riscado (e o motivo). */
export function DicaDestinatarios({ lote, cabecalho, children }: Props) {
  const { nomeDe, nomeSetor } = useChecklistEnvios();
  return (
    <span className="group/dica relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-40 mt-1 hidden w-60 rounded-lg border border-white/15 bg-[#0f172a] p-2 text-left text-xs font-normal text-white/80 shadow-xl group-hover/dica:block"
      >
        {cabecalho && <span className="mb-1 block text-white/50">{cabecalho}</span>}
        {lote.setorId && <span className="mb-1 block text-white/50">Setor {nomeSetor(lote.setorId)}</span>}
        <span className="block space-y-0.5">
          {lote.envios.map((e) => (
            <span key={e.id} className={`block truncate ${e.status === "recusado" ? "text-white/45 line-through" : ""}`}>
              {nomeDe(e.para_usuario_id)}
              {e.status === "recusado" && e.resposta ? ` — ${e.resposta}` : ""}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
