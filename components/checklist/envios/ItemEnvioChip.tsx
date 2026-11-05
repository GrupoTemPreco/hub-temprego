"use client";

import { Clock, Send, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAgora } from "@/hooks/useAgora";
import { tempoRelativo } from "@/lib/format";
import type { SituacaoEnvioLista } from "@/lib/checklistEnviosLista";
import type { EnvioDoLote, LoteDe, SituacaoEnvio, SituacaoEnvioItem } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { DicaDestinatarios } from "./DicaDestinatarios";
import { destinoDoLote, rotuloProgressoListaTodos, rotuloProgressoTodos, rotuloRecusa, situacaoPessoaListaTodos } from "./textosLote";

const COMPACTO = "px-1.5 py-0 text-[11px]";

type Props = { situacao: SituacaoEnvio<LoteDe<EnvioDoLote>>; onCiente: () => void };

/** "Aguardando <destino>" ou "Recusada por todos/<nome>" com o botão Ok; a dica lista os destinatários. */
export function EnvioChip({ situacao, onCiente }: Props) {
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
          onCiente();
        }}
        className="rounded px-1 text-[11px] font-medium text-rose-200 hover:bg-rose-500/15"
      >
        Ok
      </button>
    </span>
  );
}

export function ItemEnvioChip({ situacao }: { situacao: SituacaoEnvioItem }) {
  const { marcarCiente, progressoDoLote } = useChecklistEnvios();
  if (situacao.tipo === "todos") {
    const { lote } = situacao;
    return (
      <DicaDestinatarios lote={lote} cabecalho={rotuloProgressoTodos(lote, progressoDoLote(lote.id))} todos>
        <Badge variant="info" className={COMPACTO}>
          <Send className="h-3 w-3" />
          {rotuloProgressoTodos(lote, progressoDoLote(lote.id))}
        </Badge>
      </DicaDestinatarios>
    );
  }
  return <EnvioChip situacao={situacao} onCiente={() => void marcarCiente(situacao.lote)} />;
}

export function ListaEnvioChip({
  situacao,
  onAbrirProgresso,
}: {
  situacao: SituacaoEnvioLista;
  onAbrirProgresso?: () => void;
}) {
  const { listas } = useChecklistEnvios();
  if (situacao.tipo === "todos") {
    const { lote } = situacao;
    const progresso = listas.progressoDoLote(lote.id);
    const rotulo = rotuloProgressoListaTodos(lote);
    return (
      <DicaDestinatarios
        lote={lote}
        cabecalho={rotulo}
        situacaoDe={(e) => situacaoPessoaListaTodos(e, progresso)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAbrirProgresso?.();
          }}
          className="inline-flex"
        >
          <Badge variant="info" className={COMPACTO}>
            <Send className="h-3 w-3" />
            {rotulo}
          </Badge>
        </button>
      </DicaDestinatarios>
    );
  }
  return <EnvioChip situacao={situacao} onCiente={() => void listas.marcarCiente(situacao.lote)} />;
}
