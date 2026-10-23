"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { TELAS_NOTIFICACAO } from "@/lib/notificacoes";
import { ROTA_RH_MONITORAMENTO } from "@/lib/ferramentas";

export const ABA_CHECKLIST = "checklist";

/** Painel que a aba Checklist abre pela URL (?painel=enviadas). */
export const PAINEL_ENVIADAS = "enviadas";

/** Aba Checklist do Início: /admin?aba=checklist para admin, /?aba=checklist para os demais. */
export function rotaChecklist(isAdmin: boolean, itemId?: string, painel?: typeof PAINEL_ENVIADAS) {
  const params = new URLSearchParams({ aba: ABA_CHECKLIST });
  if (itemId) params.set("item", itemId);
  if (painel) params.set("painel", painel);
  return `${isAdmin ? "/admin" : "/"}?${params.toString()}`;
}

/**
 * Id da ferramenta aberta, "checklist" na aba Checklist, "admin" em /admin,
 * "rh-monitoramento" em /rh/monitoramento ou "inicio" na tela inicial.
 */
export function calcularTelaAtual(pathname: string, ferramentaAtivaId: string | null, aba: string | null = null): string {
  const naAbaChecklist = aba === ABA_CHECKLIST;
  if (pathname.startsWith(ROTA_RH_MONITORAMENTO)) return "rh-monitoramento";
  if (pathname.startsWith("/admin")) return naAbaChecklist ? "checklist" : "admin";
  if (pathname === "/" && ferramentaAtivaId) return ferramentaAtivaId;
  if (pathname === "/" && naAbaChecklist) return "checklist";
  return "inicio";
}

/** Tela atual do hub; usada em modulo_origem dos tickets e no filtro de telas das notificações. */
export function useTelaAtual(): string {
  const pathname = usePathname();
  const params = useSearchParams();
  const { ativa } = useFerramentaAtiva();
  return calcularTelaAtual(pathname, ativa?.id ?? null, params.get("aba"));
}

export function rotuloTela(tela: string | null) {
  if (!tela) return "—";
  // Tickets abertos quando existia a rota /tickets.
  if (tela === "tickets") return "Meus tickets";
  return TELAS_NOTIFICACAO.find((t) => t.value === tela)?.label ?? tela;
}
