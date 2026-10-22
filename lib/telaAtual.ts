"use client";

import { usePathname } from "next/navigation";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { TELAS_NOTIFICACAO } from "@/lib/notificacoes";

/** Id da ferramenta aberta, "admin" em /admin ou "inicio" na tela inicial. */
export function calcularTelaAtual(pathname: string, ferramentaAtivaId: string | null): string {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/" && ferramentaAtivaId) return ferramentaAtivaId;
  return "inicio";
}

/** Tela atual do hub; usada em modulo_origem dos tickets e no filtro de telas das notificações. */
export function useTelaAtual(): string {
  const pathname = usePathname();
  const { ativa } = useFerramentaAtiva();
  return calcularTelaAtual(pathname, ativa?.id ?? null);
}

export function rotuloTela(tela: string | null) {
  if (!tela) return "—";
  // Tickets abertos quando existia a rota /tickets.
  if (tela === "tickets") return "Meus tickets";
  return TELAS_NOTIFICACAO.find((t) => t.value === tela)?.label ?? tela;
}
