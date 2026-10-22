"use client";

import { ESTILOS_NIVEL, type NotificacaoConteudo } from "./estilosNivel";

type Props = {
  notificacao: NotificacaoConteudo;
  onConfirmar?: () => void;
  /** Renderiza sem o fundo escurecido de tela cheia (pré-visualização). */
  embutido?: boolean;
};

export function NotificacaoJanela({ notificacao, onConfirmar, embutido = false }: Props) {
  const estilo = ESTILOS_NIVEL[notificacao.nivel];
  const Icon = estilo.icone;

  const janela = (
    <div role="alertdialog" aria-modal={!embutido} className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl ${estilo.caixa}`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <Icon className={`h-6 w-6 ${estilo.iconeCor}`} />
      </div>
      <h2 className="text-lg font-semibold">{notificacao.titulo}</h2>
      <p className="mt-2 whitespace-pre-line text-sm opacity-90">{notificacao.mensagem}</p>
      <button
        type="button"
        onClick={onConfirmar}
        className={`mt-5 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors ${estilo.botao}`}
      >
        Entendi
      </button>
    </div>
  );

  if (embutido) return janela;

  return <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">{janela}</div>;
}
