"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useTelaAtual } from "@/lib/telaAtual";
import { notificacaoVisivelPara, ordenarPorCriticidade } from "@/lib/notificacoes";
import {
  carregarNotificacoesDoUsuario,
  marcarNotificacaoConfirmada,
  marcarNotificacaoVista,
} from "@/lib/notificacoesUsuario";
import type { Notificacao, NotificacaoLeitura } from "@/lib/types/shell";

const MAX_FAIXAS = 2;
const REAVALIAR_MS = 60_000;

type NotificacoesUsuarioApi = {
  /** Ativas para a pessoa em qualquer tela e formato, inclusive as já fechadas (mural da tela inicial). */
  ativas: Notificacao[];
  faixas: Notificacao[];
  aviso: Notificacao | null;
  janela: Notificacao | null;
  /** Fecha faixa/aviso ou confirma janela; grava confirmado_em e a notificação não volta mais. */
  fechar: (notificacao: Notificacao) => void;
};

const NotificacoesUsuarioContext = createContext<NotificacoesUsuarioApi | null>(null);

type Leituras = Record<string, NotificacaoLeitura>;

/** Não deixa a recarga do banco apagar uma gravação local que ainda não chegou. */
function mesclarLeituras(locais: Leituras, servidor: NotificacaoLeitura[]): Leituras {
  const r: Leituras = { ...locais };
  for (const l of servidor) {
    const local = locais[l.notificacao_id];
    r[l.notificacao_id] = {
      ...l,
      visto_em: l.visto_em ?? local?.visto_em ?? null,
      confirmado_em: l.confirmado_em ?? local?.confirmado_em ?? null,
    };
  }
  return r;
}

function useRecarregarComRealtime() {
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    const canal = supabase
      .channel(`notificacoes-usuario-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "shell", table: "notificacoes" }, () => setVersao((v) => v + 1))
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);
  return versao;
}

export function NotificacoesUsuarioProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuarioAtual();
  const tela = useTelaAtual();
  const versao = useRecarregarComRealtime();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [leituras, setLeituras] = useState<Leituras>({});
  const [agora, setAgora] = useState(() => new Date());
  /** notificacao_id -> visto_em gravado nesta sessão. */
  const vistasRef = useRef(new Map<string, string>());

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), REAVALIAR_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let ativo = true;
    carregarNotificacoesDoUsuario(usuario.id)
      .then((d) => {
        if (!ativo) return;
        setNotificacoes(d.notificacoes);
        setLeituras((prev) => mesclarLeituras(prev, d.leituras));
        setAgora(new Date());
      })
      .catch((err) => console.error("[notificacoes] Falha ao carregar:", err));
    return () => {
      ativo = false;
    };
  }, [usuario.id, versao]);

  const fechar = useCallback(
    (n: Notificacao) => {
      const leitura = leituras[n.id];
      if (leitura?.confirmado_em) return;
      const confirmadoEm = new Date().toISOString();
      const vistoEm = leitura?.visto_em ?? vistasRef.current.get(n.id) ?? confirmadoEm;
      setLeituras((prev) => ({
        ...prev,
        [n.id]: { notificacao_id: n.id, usuario_id: usuario.id, visto_em: vistoEm, confirmado_em: confirmadoEm },
      }));
      marcarNotificacaoConfirmada(n.id, usuario.id, vistoEm, confirmadoEm).catch((err) =>
        console.error("[notificacoes] Falha ao confirmar:", err),
      );
    },
    [leituras, usuario.id],
  );

  const valor = useMemo<NotificacoesUsuarioApi>(() => {
    const paraPessoa = (telaFiltro: string | null) =>
      ordenarPorCriticidade(
        notificacoes.filter((n) => notificacaoVisivelPara(n, usuario.id, usuario.setores, telaFiltro, agora)),
      );
    const pendentes = paraPessoa(tela).filter((n) => !leituras[n.id]?.confirmado_em);
    return {
      ativas: paraPessoa(null),
      faixas: pendentes.filter((n) => n.formato === "faixa").slice(0, MAX_FAIXAS),
      aviso: pendentes.find((n) => n.formato === "aviso") ?? null,
      janela: pendentes.find((n) => n.formato === "janela") ?? null,
      fechar,
    };
  }, [notificacoes, leituras, usuario.id, usuario.setores, tela, agora, fechar]);

  useEffect(() => {
    const exibidas = [...valor.faixas, valor.aviso, valor.janela].filter((n): n is Notificacao => Boolean(n));
    for (const n of exibidas) {
      if (leituras[n.id]?.visto_em || vistasRef.current.has(n.id)) continue;
      vistasRef.current.set(n.id, new Date().toISOString());
      marcarNotificacaoVista(n.id, usuario.id).catch((err) =>
        console.error("[notificacoes] Falha ao registrar visualização:", err),
      );
    }
  }, [valor, leituras, usuario.id]);

  return <NotificacoesUsuarioContext.Provider value={valor}>{children}</NotificacoesUsuarioContext.Provider>;
}

export function useNotificacoesUsuario(): NotificacoesUsuarioApi {
  const ctx = useContext(NotificacoesUsuarioContext);
  if (!ctx) throw new Error("useNotificacoesUsuario precisa estar dentro de <NotificacoesUsuarioProvider>.");
  return ctx;
}
