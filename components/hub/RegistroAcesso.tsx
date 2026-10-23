"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { INTERVALO_REGISTRO_MS, registrarAcesso, type ResultadoRegistro } from "@/lib/registroAcesso";
import { useUsuarioAtual } from "./UsuarioAtualProvider";

const SEM_ACESSO_ANTERIOR_MS = 7 * 86_400_000;

/** "desde": o acesso anterior a este, base do resumo "Enquanto você estava fora". */
export type MarcoDesde = { status: "carregando" } | { status: "pronto"; desde: string } | { status: "indisponivel" };

const DesdeContext = createContext<MarcoDesde>({ status: "carregando" });

// Primeira chamada de cada usuário nesta página. As seguintes (e uma segunda montagem, como no
// StrictMode) não podem trocar o "desde": a essa altura o banco já devolveria o acesso recém-gravado.
const primeiras = new Map<string, Promise<ResultadoRegistro>>();

/**
 * Registra o acesso ao hub ao abrir e a cada 5 minutos enquanto a aba do navegador estiver visível,
 * e guarda o "desde" da primeira chamada (sem acesso anterior: agora menos 7 dias).
 */
export function RegistroAcessoProvider({ children }: { children: ReactNode }) {
  const usuarioId = useUsuarioAtual().id;
  const [marco, setMarco] = useState<MarcoDesde>({ status: "carregando" });

  useEffect(() => {
    let vivo = true;
    if (!primeiras.has(usuarioId)) primeiras.set(usuarioId, registrarAcesso(false));
    primeiras.get(usuarioId)!.then((r) => {
      if (!vivo) return;
      setMarco(
        r.ok
          ? { status: "pronto", desde: r.anterior ?? new Date(Date.now() - SEM_ACESSO_ANTERIOR_MS).toISOString() }
          : { status: "indisponivel" },
      );
    });
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void registrarAcesso(false);
    }, INTERVALO_REGISTRO_MS);
    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [usuarioId]);

  return <DesdeContext.Provider value={marco}>{children}</DesdeContext.Provider>;
}

export function useDesde() {
  return useContext(DesdeContext);
}
