"use client";

import { useState, type ReactNode } from "react";
import { resumoResultado, type ResultadoMassa } from "@/lib/acoesMassa";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export type PedidoMassa = {
  /** Resumo da ação, ex.: "Ligar Recebe tickets para 10 usuários?" */
  titulo: string;
  descricao?: ReactNode;
  rotuloConfirmar?: string;
  perigo?: boolean;
  executar: () => Promise<ResultadoMassa>;
  /** Toast quando tudo deu certo, ex.: (n) => "Recebe tickets ligado para 10 usuários." */
  sucesso: (n: number) => string;
  /** Roda depois, com ou sem falhas (ex.: recarregar a lista). */
  depois?: () => Promise<void> | void;
};

/** Confirmação com resumo, execução e toast de resultado, iguais em todas as ações em massa. */
export function useConfirmacaoMassa() {
  const toast = useToast();
  const [pedido, setPedido] = useState<PedidoMassa | null>(null);
  const [executando, setExecutando] = useState(false);

  async function confirmar() {
    if (!pedido) return;
    setExecutando(true);
    try {
      const resumo = resumoResultado(await pedido.executar(), pedido.sucesso);
      if (resumo.ok) toast.success(resumo.texto);
      else toast.error(resumo.texto);
      await pedido.depois?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setExecutando(false);
      setPedido(null);
    }
  }

  const dialogo = (
    <ConfirmDialog
      open={pedido !== null}
      title={pedido?.titulo ?? ""}
      description={pedido?.descricao}
      confirmLabel={pedido?.rotuloConfirmar ?? "Confirmar"}
      danger={pedido?.perigo}
      loading={executando}
      onConfirm={confirmar}
      onCancel={() => setPedido(null)}
    />
  );

  return { pedir: setPedido, executando, dialogo };
}
