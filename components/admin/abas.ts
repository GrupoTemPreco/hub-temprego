import { Bell, Building2, Database, LayoutDashboard, ListChecks, Ticket, Users } from "lucide-react";
import type { TabItem } from "@/components/ui/Tabs";

export type AbaAdmin = "visao-geral" | "checklist" | "usuarios" | "setores" | "tickets" | "notificacoes" | "sistema";

export const ABAS_ADMIN: TabItem<AbaAdmin>[] = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "setores", label: "Setores", icon: Building2 },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "sistema", label: "Sistema", icon: Database },
];

/** A aba Checklist só existe para quem tem acesso_checklist. */
export function abasDisponiveis(acessoChecklist: boolean): TabItem<AbaAdmin>[] {
  return acessoChecklist ? ABAS_ADMIN : ABAS_ADMIN.filter((a) => a.id !== "checklist");
}

export function parseAba(valor: string | null, acessoChecklist = false): AbaAdmin {
  return abasDisponiveis(acessoChecklist).some((a) => a.id === valor) ? (valor as AbaAdmin) : "visao-geral";
}

/** Navega para uma aba do admin, com filtros extras opcionais na URL. */
export type NavegarAba = (aba: AbaAdmin, extras?: Record<string, string>) => void;
