"use client";

import { Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAgora } from "@/hooks/useAgora";
import { tempoRelativo } from "@/lib/format";
import type { SituacaoEnvioItem } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { DicaDestinatarios } from "./DicaDestinatarios";
import { destinoDoLote, rotuloRecusa } from "./textosLote";

const COMPACTO = "px-1.5 py-0 text-[11px]";

/** "Aguardando <destino>" ou "Recusada por todos/<nome>" com o botão Ok; a dica lista os destinatários. */
export function ItemEnvioChip({ situacao }: { situacao: SituacaoEnvioItem }) {
  const envios = useChecklistEnvios();
  const agora = useAgora();
  const { lote } = situacao;

  if (situacao.tipo === "aguardando") {
    return (
      <DicaDestinatarios lote={lote} cabecalho={`Enviado ${tempoRelativo(lote.ultimoEnvioEm, new Date(agora))}`}>
        <Badge variant="neutral" className={COMPACTO}>
          <Clock className="h-3 w-3" />
          Aguardando {destinoDoLote(lote, envios)}
        </Badge>
      </DicaDestinatarios>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <DicaDestinatarios lote={lote} cabecalho="Motivos">
        <Badge variant="danger" className={COMPACTO}>
          <XCircle className="h-3 w-3" />
          {rotuloRecusa(lote, envios)}
        </Badge>
      </DicaDestinatarios>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void envios.marcarCiente(lote);
        }}
        className="rounded px-1 text-[11px] font-medium text-rose-200 hover:bg-rose-500/15"
      >
        Ok
      </button>
    </span>
  );
}
