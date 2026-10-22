import { Bell, Building2, Database, LayoutDashboard, Ticket, Users } from "lucide-react";
import type { TabItem } from "@/components/ui/Tabs";

export type AbaAdmin = "visao-geral" | "usuarios" | "setores" | "tickets" | "notificacoes" | "sistema";

export const ABAS_ADMIN: TabItem<AbaAdmin>[] = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "setores", label: "Setores", icon: Building2 },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "sistema", label: "Sistema", icon: Database },
];

export function parseAba(valor: string | null): AbaAdmin {
  return ABAS_ADMIN.some((a) => a.id === valor) ? (valor as AbaAdmin) : "visao-geral";
}

/** Navega para uma aba do admin, com filtros extras opcionais na URL. */
export type NavegarAba = (aba: AbaAdmin, extras?: Record<string, string>) => void;
