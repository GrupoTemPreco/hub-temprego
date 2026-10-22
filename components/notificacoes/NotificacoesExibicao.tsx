"use client";

import { NotificacaoFaixa } from "./NotificacaoFaixa";
import { NotificacaoAviso } from "./NotificacaoAviso";
import { NotificacaoJanela } from "./NotificacaoJanela";
import { useNotificacoesUsuario } from "./NotificacoesUsuarioProvider";

/** Faixas no topo da área de conteúdo (acima do iframe), no máximo 2, mais críticas primeiro. */
export function FaixasNotificacao() {
  const { faixas, fechar } = useNotificacoesUsuario();
  if (faixas.length === 0) return null;
  return (
    <div className="shrink-0">
      {faixas.map((n) => (
        <NotificacaoFaixa key={n.id} notificacao={n} embutido onFechar={() => fechar(n)} />
      ))}
    </div>
  );
}

/** Aviso no canto inferior esquerdo (um por vez) e janela modal em sequência. */
export function NotificacoesFlutuantes() {
  const { aviso, janela, fechar } = useNotificacoesUsuario();
  return (
    <>
      {aviso && (
        <div className="fixed bottom-4 left-4 z-55 max-w-[calc(100vw-2rem)]">
          <NotificacaoAviso key={aviso.id} notificacao={aviso} embutido onFechar={() => fechar(aviso)} />
        </div>
      )}
      {janela && <NotificacaoJanela key={janela.id} notificacao={janela} onConfirmar={() => fechar(janela)} />}
    </>
  );
}
