"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Ferramenta } from "@/lib/ferramentas";

type FerramentaAtivaApi = {
  ativa: Ferramenta | null;
  /** Abre a ferramenta na home; se estiver em outra tela (ex.: /admin), volta para "/". */
  abrir: (app: Ferramenta) => void;
  fechar: () => void;
  irPara: (rota: string) => void;
};

const FerramentaAtivaContext = createContext<FerramentaAtivaApi | null>(null);

export function FerramentaAtivaProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ativa, setAtiva] = useState<Ferramenta | null>(null);

  const abrir = useCallback(
    (app: Ferramenta) => {
      setAtiva(app);
      if (pathname !== "/") router.push("/");
    },
    [pathname, router],
  );

  const fechar = useCallback(() => setAtiva(null), []);

  const irPara = useCallback(
    (rota: string) => {
      setAtiva(null);
      if (pathname !== rota) router.push(rota);
    },
    [pathname, router],
  );

  const api = useMemo(() => ({ ativa, abrir, fechar, irPara }), [ativa, abrir, fechar, irPara]);

  return <FerramentaAtivaContext.Provider value={api}>{children}</FerramentaAtivaContext.Provider>;
}

export function useFerramentaAtiva(): FerramentaAtivaApi {
  const ctx = useContext(FerramentaAtivaContext);
  if (!ctx) throw new Error("useFerramentaAtiva precisa estar dentro de <FerramentaAtivaProvider>.");
  return ctx;
}
