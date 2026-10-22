"use client";

import { X } from "lucide-react";
import { ESTILOS_NIVEL, type NotificacaoConteudo } from "./estilosNivel";

type Props = {
  notificacao: NotificacaoConteudo;
  onFechar?: () => void;
  /** Renderiza no fluxo da página (pré-visualização) em vez de fixo no canto. */
  embutido?: boolean;
};

export function NotificacaoAviso({ notificacao, onFechar, embutido = false }: Props) {
  const estilo = ESTILOS_NIVEL[notificacao.nivel];
  const Icon = estilo.icone;

  return (
    <div
      role="status"
      className={`flex w-80 max-w-full items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur ${estilo.caixa} ${
        embutido ? "" : "fixed bottom-4 right-4 z-55"
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${estilo.iconeCor}`} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{notificacao.titulo}</p>
        <p className="mt-1 whitespace-pre-line text-sm opacity-90">{notificacao.mensagem}</p>
      </div>
      {onFechar && (
        <button onClick={onFechar} aria-label="Fechar" className="shrink-0 rounded p-0.5 opacity-70 hover:bg-white/10 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
