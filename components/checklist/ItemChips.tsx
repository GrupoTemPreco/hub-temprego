import { CalendarDays } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { opcaoNivel, opcaoUrgencia } from "@/lib/checklistOpcoes";
import { formatarPrazo, situacaoPrazo } from "@/lib/checklistRegras";

const COMPACTO = "px-1.5 py-0 text-[11px]";

export function NivelChip({ nivel }: { nivel: number }) {
  const opcao = opcaoNivel(nivel);
  return (
    <Badge variant={opcao.cor} className={COMPACTO}>
      {opcao.label}
    </Badge>
  );
}

export function UrgenciaChip({ urgencia }: { urgencia: number }) {
  const opcao = opcaoUrgencia(urgencia);
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
