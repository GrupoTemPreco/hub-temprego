"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSomNotificacao } from "@/hooks/useSomNotificacao";
import {
  VOLUME_GLOBAL_PADRAO,
  assinarVolumeGlobal,
  definirVolumeGlobal,
  lerVolumeGlobal,
  salvarVolumePessoal,
  volumeEfetivo,
} from "@/lib/volumeNotificacao";
import { useUsuarioAtual } from "./UsuarioAtualProvider";

type SomApi = {
  /** Toca o aviso (no máximo um a cada 10 s no hub inteiro). Todas as fontes de aviso usam esta função. */
  tocar: () => void;
  testar: (volume: number) => void;
  /** Volume que vale para o usuário: o pessoal ou, sem ele, o de todos. */
  volume: number;
  volumeGlobal: number;
  volumePessoal: number | null;
  /** Só o admin pode desligar o som, e só para ele. Para os demais, é sempre ligado. */
  ligado: boolean;
  alternarLigado: () => void;
  salvarParaMim: (volume: number) => Promise<void>;
  salvarParaTodos: (volume: number) => Promise<void>;
  usarPadrao: () => Promise<void>;
};

const SomContext = createContext<SomApi | null>(null);

const chaveLigadoAdmin = (usuarioId: string) => `hub:som-admin-ligado:${usuarioId}`;
/** Preferências antigas (antes do volume controlado pelo admin); não são mais lidas. */
const chavesAntigas = (usuarioId: string) => [`hub:som-tickets:${usuarioId}`, `hub:volume-tickets:${usuarioId}`];

function lerLigadoAdmin(usuarioId: string) {
  try {
    return window.localStorage.getItem(chaveLigadoAdmin(usuarioId)) !== "desligado";
  } catch {
    return true;
  }
}

export function SomNotificacaoProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuarioAtual();
  const [volumeGlobal, setVolumeGlobal] = useState(VOLUME_GLOBAL_PADRAO);
  const [volumePessoal, setVolumePessoal] = useState<number | null>(usuario.volumeNotificacao);
  const [ligadoAdmin, setLigadoAdmin] = useState(() => lerLigadoAdmin(usuario.id));
  const ligado = usuario.isAdmin ? ligadoAdmin : true;
  const volume = volumeEfetivo(volumePessoal, volumeGlobal);
  const som = useSomNotificacao({ volume, ligado });

  useEffect(() => {
    try {
      chavesAntigas(usuario.id).forEach((c) => window.localStorage.removeItem(c));
    } catch {
      // Sem localStorage: nada para apagar.
    }
  }, [usuario.id]);

  useEffect(() => {
    let vivo = true;
    lerVolumeGlobal()
      .then((v) => vivo && setVolumeGlobal(v))
      .catch((err) => console.error("[som] Falha ao ler o volume global:", err));
    const parar = assinarVolumeGlobal(setVolumeGlobal);
    return () => {
      vivo = false;
      parar();
    };
  }, []);

  const alternarLigado = useCallback(() => {
    setLigadoAdmin((atual) => {
      const novo = !atual;
      try {
        window.localStorage.setItem(chaveLigadoAdmin(usuario.id), novo ? "ligado" : "desligado");
      } catch {
        // Sem localStorage, vale só nesta sessão.
      }
      return novo;
    });
  }, [usuario.id]);

  const salvarParaMim = useCallback(
    async (v: number) => {
      await salvarVolumePessoal(usuario.id, v);
      setVolumePessoal(v);
    },
    [usuario.id],
  );

  const salvarParaTodos = useCallback(
    async (v: number) => {
      await definirVolumeGlobal(v);
      await salvarVolumePessoal(usuario.id, null);
      setVolumeGlobal(v);
      setVolumePessoal(null);
    },
    [usuario.id],
  );

  const usarPadrao = useCallback(async () => {
    await salvarVolumePessoal(usuario.id, null);
    setVolumePessoal(null);
  }, [usuario.id]);

  const api = useMemo<SomApi>(
    () => ({
      tocar: som.tocar,
      testar: som.testar,
      volume,
      volumeGlobal,
      volumePessoal,
      ligado,
      alternarLigado,
      salvarParaMim,
      salvarParaTodos,
      usarPadrao,
    }),
    [som.tocar, som.testar, volume, volumeGlobal, volumePessoal, ligado, alternarLigado, salvarParaMim, salvarParaTodos, usarPadrao],
  );

  return <SomContext.Provider value={api}>{children}</SomContext.Provider>;
}

export function useSom(): SomApi {
  const ctx = useContext(SomContext);
  if (!ctx) throw new Error("useSom precisa estar dentro de <SomNotificacaoProvider>.");
  return ctx;
}
