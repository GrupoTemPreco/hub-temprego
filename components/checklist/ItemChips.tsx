import { CalendarDays, Repeat } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { opcaoNivel, opcaoUrgencia } from "@/lib/checklistOpcoes";
import { formatarPrazo, situacaoPrazo } from "@/lib/checklistRegras";
import { rotuloDias, textoAtrasada, textoProxima } from "@/lib/checklistDiarias";

const COMPACTO = "px-1.5 py-0 text-[11px]";

export function NivelChip({ nivel }: { nivel: number | null }) {
  const opcao = opcaoNivel(nivel);
  if (!opcao) return null;
  return (
    <Badge variant={opcao.cor} className={COMPACTO}>
      {opcao.label}
    </Badge>
  );
}

export function UrgenciaChip({ urgencia }: { urgencia: number | null }) {
  const opcao = opcaoUrgencia(urgencia);
  if (!opcao) return null;
  return (
    <Badge variant={opcao.cor} className={COMPACTO}>
      {opcao.label}
    </Badge>
  );
}

const COR_PRAZO: Record<ReturnType<typeof situacaoPrazo>, BadgeVariant> = {
  vencido: "danger",
  proximo: "warning",
  normal: "neutral",
};

/** Itens feitos não ganham alerta de vencimento. */
export function PrazoChip({ prazo, feito }: { prazo: string; feito: boolean }) {
  const situacao = feito ? "normal" : situacaoPrazo(prazo);
  return (
    <Badge variant={COR_PRAZO[situacao]} className={COMPACTO}>
      <CalendarDays className="h-3 w-3" />
      {formatarPrazo(prazo)}
    </Badge>
  );
}

export function EmAndamentoChip() {
  return (
    <Badge variant="info" className={COMPACTO}>
      Em andamento
    </Badge>
  );
}

/** "Diária", "Toda quarta", "Dias úteis" ou "Seg, Qua, Sex". */
export function DiariaChip({ dias = null }: { dias?: readonly number[] | null }) {
  return (
    <Badge variant="info" className={COMPACTO}>
      <Repeat className="h-3 w-3" />
      {rotuloDias(dias)}
    </Badge>
  );
}

export function AtrasadaChip({ ocorrencia }: { ocorrencia: string }) {
  return (
    <Badge variant="danger" className={COMPACTO}>
      {textoAtrasada(ocorrencia)}
    </Badge>
  );
}

export function ProximaTexto({ data }: { data: string }) {
  return <span className="text-[11px] text-texto/45">{textoProxima(data)}</span>;
}
