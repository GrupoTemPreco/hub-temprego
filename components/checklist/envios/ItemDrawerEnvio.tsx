"use client";

import { Ban, Check, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAgora } from "@/hooks/useAgora";
import { tempoRelativo } from "@/lib/format";
import { formatarPrazo } from "@/lib/checklistRegras";
import type { LoteEnvio, SituacaoEnvioItem } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { useAcoesEnvioItem } from "./AcoesEnvioItem";
import { BotaoReenviar } from "./BotaoReenviar";
import { STATUS_DESTINATARIO, destinoDoLote, motivosRecusa, rotuloRecusa } from "./textosLote";

const BOTAO_PEQUENO =
  "inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/85 hover:bg-white/10";

function Destinatarios({ lote }: { lote: LoteEnvio }) {
  const { nomeDe } = useChecklistEnvios();
  if (lote.envios.length < 2) return null;
  return (
    <ul className="space-y-1">
      {lote.envios.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <span className={`truncate ${e.status === "recusado" ? "text-white/45 line-through" : "text-white/80"}`}>
            {nomeDe(e.para_usuario_id)}
          </span>
          <Badge variant={STATUS_DESTINATARIO[e.status].cor} className="shrink-0 px-1.5 py-0 text-[11px]">
            {STATUS_DESTINATARIO[e.status].texto}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** Quadro no topo do Drawer quando o item foi enviado: aguardando resposta ou recusado por todos. */
export function ItemDrawerEnvio({ situacao }: { situacao: SituacaoEnvioItem }) {
  const envios = useChecklistEnvios();
  const acoes = useAcoesEnvioItem();
  const agora = useAgora();
  const { lote } = situacao;

  if (situacao.tipo === "aguardando") {
    return (
      <div className="space-y-2 rounded-lg border border-white/15 bg-white/5 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-white">
          <Clock className="h-4 w-4 text-white/60" />
          Aguardando {destinoDoLote(lote, envios)} · enviado {tempoRelativo(lote.ultimoEnvioEm, new Date(agora))}
        </p>
        <Destinatarios lote={lote} />
        {lote.mensagem && <p className="text-white/65">&ldquo;{lote.mensagem}&rdquo;</p>}
        {lote.prazoSugerido && <p className="text-xs text-white/50">Prazo sugerido: {formatarPrazo(lote.prazoSugerido)}</p>}
        <p className="text-xs text-white/50">Enquanto aguarda resposta, o item não pode ser editado, concluído nem excluído.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <BotaoReenviar lote={lote} className={BOTAO_PEQUENO} />
          <button type="button" className={`${BOTAO_PEQUENO} text-rose-300`} onClick={() => acoes?.cancelar(lote)}>
            <Ban className="h-3.5 w-3.5" /> Cancelar envio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-rose-200">
        <XCircle className="h-4 w-4" /> {rotuloRecusa(lote, envios)}
      </p>
      <ul className="space-y-0.5 text-white/70">
        {motivosRecusa(lote, envios).map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <Button size="sm" variant="secondary" onClick={() => void envios.marcarCiente(lote)}>
        <Check className="h-3.5 w-3.5" /> Ok
      </Button>
    </div>
  );
}
