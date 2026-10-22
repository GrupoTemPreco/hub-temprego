import type { ComponentType } from "react";
import { formatarTamanho } from "@/lib/format";
import { calcularOcupacao, type FaixaOcupacao } from "@/lib/admin/armazenamento";

const CORES: Record<FaixaOcupacao, { barra: string; texto: string }> = {
  verde: { barra: "bg-emerald-500", texto: "text-emerald-300" },
  ambar: { barra: "bg-amber-500", texto: "text-amber-300" },
  vermelho: { barra: "bg-rose-500", texto: "text-rose-300" },
};

type Props = {
  titulo: string;
  icon: ComponentType<{ className?: string }>;
  usadoBytes: number;
  limiteGb: number;
  /** Linha extra abaixo da barra (ex.: quantidade de arquivos). */
  detalhe?: string;
};

/** "5,9 GB de 8 GB", barra verde/âmbar/vermelha e quanto ainda está disponível (ou excedido). */
export function CardLimite({ titulo, icon: Icon, usadoBytes, limiteGb, detalhe }: Props) {
  const { limiteBytes, percentual, disponivelBytes, faixa } = calcularOcupacao(usadoBytes, limiteGb);
  const cor = CORES[faixa];

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-white/70">{titulo}</p>
          <p className="text-lg font-semibold leading-tight">
            {formatarTamanho(usadoBytes)} <span className="text-sm font-normal text-white/50">de {formatarTamanho(limiteBytes)}</span>
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${cor.barra}`} style={{ width: `${Math.min(percentual, 100)}%` }} />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
        <span className={cor.texto}>
          {disponivelBytes >= 0
            ? `${formatarTamanho(disponivelBytes)} disponíveis`
            : `${formatarTamanho(-disponivelBytes)} acima do incluído no plano`}
        </span>
        <span className="text-white/45">{Math.round(percentual)}%</span>
      </div>
      {detalhe && <p className="mt-1 text-xs text-white/40">{detalhe}</p>}
    </div>
  );
}
