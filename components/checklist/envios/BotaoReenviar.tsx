"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useAgora } from "@/hooks/useAgora";
import { minutosParaReenviar } from "@/lib/checklistEnvios";
import type { LoteEnvio } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";

type BaseProps = {
  /** Último envio ou reenvio do lote: o botão fica bloqueado por 30 minutos a partir dele. */
  ultimoEnvioEm: string;
  reenviar: () => Promise<boolean>;
  textoOk: string;
  className: string;
  onFeito?: () => void;
};

/** Reenvia para todos os pendentes do lote; fica bloqueado por 30 minutos após o último envio ou reenvio do lote. */
export function BotaoReenviarBase({ ultimoEnvioEm, reenviar, textoOk, className, onFeito }: BaseProps) {
  const toast = useToast();
  const agora = useAgora();
  const [enviando, setEnviando] = useState(false);
  const faltam = minutosParaReenviar({ ultimoEnvioEm }, agora);

  return (
    <button
      type="button"
      disabled={faltam > 0 || enviando}
      title={faltam > 0 ? `Disponível em ${faltam} min` : "Reenviar"}
      onClick={async (e) => {
        e.stopPropagation();
        setEnviando(true);
        const ok = await reenviar();
        setEnviando(false);
        if (!ok) return;
        toast.success(textoOk);
        onFeito?.();
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <RotateCw className="h-3.5 w-3.5" />
      {faltam > 0 ? `Reenviar (${faltam} min)` : "Reenviar"}
    </button>
  );
}

type Props = { lote: LoteEnvio; className: string; onFeito?: () => void };

export function BotaoReenviar({ lote, className, onFeito }: Props) {
  const { reenviar } = useChecklistEnvios();
  return (
    <BotaoReenviarBase
      ultimoEnvioEm={lote.ultimoEnvioEm}
      reenviar={() => reenviar(lote)}
      textoOk="Tarefa reenviada."
      className={className}
      onFeito={onFeito}
    />
  );
}
