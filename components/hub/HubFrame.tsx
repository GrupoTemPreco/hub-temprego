"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TicketsUsuarioProvider } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { BalaoTickets } from "@/components/tickets/usuario/BalaoTickets";
import { NotificacoesUsuarioProvider } from "@/components/notificacoes/NotificacoesUsuarioProvider";
import { FaixasNotificacao, NotificacoesFlutuantes } from "@/components/notificacoes/NotificacoesExibicao";
import { ChecklistEnviosProvider } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { UsuarioAtualProvider } from "./UsuarioAtualProvider";
import { SomNotificacaoProvider } from "./SomNotificacaoProvider";
import { FerramentaAtivaProvider } from "./FerramentaAtivaProvider";
import { DestaquesMenuProvider } from "./DestaquesMenuProvider";
import { HubSidebar } from "./HubSidebar";
import { RegistroAcessoProvider } from "./RegistroAcesso";
import { TrocaSenhaObrigatoria } from "./TrocaSenhaObrigatoria";

function Moldura({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // No celular a home tem telas próprias, sem sidebar.
  if (isMobile && pathname === "/") return <>{children}</>;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617]">
      <HubSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <FaixasNotificacao />
        <div className="flex min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function HubFrame({ children }: { children: ReactNode }) {
  return (
    <UsuarioAtualProvider>
      <TrocaSenhaObrigatoria>
        <RegistroAcessoProvider>
          <SomNotificacaoProvider>
            <DestaquesMenuProvider>
              <FerramentaAtivaProvider>
                <ChecklistEnviosProvider>
                  <TicketsUsuarioProvider>
                    <NotificacoesUsuarioProvider>
                      <Moldura>{children}</Moldura>
                      <BalaoTickets />
                      <NotificacoesFlutuantes />
                    </NotificacoesUsuarioProvider>
                  </TicketsUsuarioProvider>
                </ChecklistEnviosProvider>
              </FerramentaAtivaProvider>
            </DestaquesMenuProvider>
          </SomNotificacaoProvider>
        </RegistroAcessoProvider>
      </TrocaSenhaObrigatoria>
    </UsuarioAtualProvider>
  );
}
