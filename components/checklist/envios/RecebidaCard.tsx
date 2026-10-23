"use client";

import { Building2, CalendarDays, Check, RotateCw, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { tempoRelativo } from "@/lib/format";
import { formatarPrazo } from "@/lib/checklistRegras";
import { ultimoEnvioEm } from "@/lib/checklistEnvios";
import type { ChecklistEnvio, ChecklistItem } from "@/lib/types/shell";
import { NivelChip, UrgenciaChip } from "../ItemChips";

type Props = {
  envio: ChecklistEnvio;
  /** Nulo quando o item foi apagado: o card fica só com o título salvo e sem "Aceitar". Indefinido = carregando. */
  item: ChecklistItem | null | undefined;
  remetente: string;
  /** "Para Financeiro" (envio para setor) ou "Enviada para 3 pessoas". */
  seloDestino?: string;
  agora: number;
  onAceitar: () => void;
  onRecusar: () => void;
};

export function RecebidaCard({ envio, item, remetente, seloDestino, agora, onAceitar, onRecusar }: Props) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-blue-400/25 bg-blue-500/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-semibold text-white">{item?.titulo ?? envio.titulo}</h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {seloDestino && (
            <Badge variant="info" className="shrink-0">
              {envio.setor_id ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />} {seloDestino}
            </Badge>
          )}
          {envio.reenvios > 0 && (
            <Badge variant="warning" className="shrink-0">
              <RotateCw className="h-3 w-3" /> reenviada
            </Badge>
          )}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-white/60">
        <Avatar nome={remetente} />
        <span>
          De <span className="font-medium text-white/85">{remetente}</span> · enviado{" "}
          {tempoRelativo(ultimoEnvioEm(envio), new Date(agora))}
        </span>
      </p>

      {envio.mensagem && <p className="text-sm text-white/75">&ldquo;{envio.mensagem}&rdquo;</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        {item && <NivelChip nivel={item.nivel} />}
        {item && <UrgenciaChip urgencia={item.urgencia} />}
        {envio.prazo_sugerido && (
          <Badge className="px-1.5 py-0 text-[11px]">
            <CalendarDays className="h-3 w-3" /> Prazo sugerido {formatarPrazo(envio.prazo_sugerido)}
          </Badge>
        )}
        {item === null && <span className="text-xs text-white/45">O item original não existe mais.</span>}
      </div>

      <div className="mt-auto flex justify-end gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={onRecusar}>
          <X className="h-3.5 w-3.5" /> Recusar
        </Button>
        {item !== null && (
          <Button size="sm" onClick={onAceitar} disabled={!item}>
            <Check className="h-3.5 w-3.5" /> Aceitar
          </Button>
        )}
      </div>
    </article>
  );
}
