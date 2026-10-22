"use client";

import { X } from "lucide-react";
import { ESTILOS_NIVEL, type NotificacaoConteudo } from "./estilosNivel";

type Props = {
  notificacao: NotificacaoConteudo;
  onFechar?: () => void;
  /** Renderiza no fluxo da página (pré-visualização) em vez de fixo no topo. */
  embutido?: boolean;
};

export function NotificacaoFaixa({ notificacao, onFechar, embutido = false }: Props) {
  const estilo = ESTILOS_NIVEL[notificacao.nivel];
  const Icon = estilo.icone;

  return (
    <div
      role="status"
      className={`flex w-full items-start gap-3 border-b px-4 py-2.5 text-sm ${estilo.caixa} ${
        embutido ? "" : "fixed inset-x-0 top-0 z-55"
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${estilo.iconeCor}`} />
      <p className="min-w-0 flex-1 whitespace-pre-line">
        <strong className="font-semibold">{notificacao.titulo}</strong>
        {notificacao.mensagem && <span className="opacity-90"> — {notificacao.mensagem}</span>}
      </p>
      {onFechar && (
        <button onClick={onFechar} aria-label="Fechar" className="shrink-0 rounded p-0.5 opacity-70 hover:bg-white/10 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
