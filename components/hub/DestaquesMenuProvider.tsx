"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { carregarDestaquesVigentes, destaquesPorFerramenta } from "@/lib/destaques";
import type { DestaqueMenu } from "@/lib/types/shell";

type DestaquesMenuApi = {
  destaqueDe: (ferramentaId: string) => DestaqueMenu | undefined;
  recarregar: () => Promise<void>;
};

const DestaquesMenuContext = createContext<DestaquesMenuApi | null>(null);

export function DestaquesMenuProvider({ children }: { children: ReactNode }) {
  const [destaques, setDestaques] = useState<DestaqueMenu[]>([]);

  const recarregar = useCallback(
    (): Promise<void> =>
      carregarDestaquesVigentes()
        .then(setDestaques)
        .catch((err) => console.error("[destaques_menu] Falha ao carregar:", err)),
    [],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const api = useMemo<DestaquesMenuApi>(() => {
    const mapa = destaquesPorFerramenta(destaques);
    return { destaqueDe: (id) => mapa.get(id), recarregar };
  }, [destaques, recarregar]);

  return <DestaquesMenuContext.Provider value={api}>{children}</DestaquesMenuContext.Provider>;
}

export function useDestaquesMenu(): DestaquesMenuApi {
  const ctx = useContext(DestaquesMenuContext);
  if (!ctx) throw new Error("useDestaquesMenu precisa estar dentro de <DestaquesMenuProvider>.");
  return ctx;
}
