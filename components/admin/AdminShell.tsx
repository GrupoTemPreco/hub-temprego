"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { SaudacaoUsuario } from "@/components/inicio/SaudacaoUsuario";
import { ChecklistPagina } from "@/components/checklist/ChecklistPagina";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { abasDisponiveis, parseAba, type AbaAdmin } from "./abas";
import { VisaoGeralTab } from "./visao-geral/VisaoGeralTab";
import { UsuariosTab } from "./usuarios/UsuariosTab";
import { SetoresTab } from "./setores/SetoresTab";
import { TicketsTab } from "./tickets/TicketsTab";
import { NotificacoesTab } from "./notificacoes/NotificacoesTab";
import { SistemaTab } from "./sistema/SistemaTab";

export function AdminShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const usuario = useUsuarioAtual();
  const aba = parseAba(searchParams.get("aba"), usuario.acessoChecklist);
  const recebidos = useChecklistEnvios().recebidos.length;
  const abas = abasDisponiveis(usuario.acessoChecklist).map((a) =>
    a.id === "checklist" ? { ...a, count: recebidos } : a,
  );

  const navegar = useCallback(
    (destino: AbaAdmin, extras?: Record<string, string>) => {
      const params = new URLSearchParams({ aba: destino, ...extras });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-6 text-white">
      <div className="mb-5">
        <SaudacaoUsuario nome={usuario.nome} subtitulo="Painel de administração do Hub Tempreço" />
      </div>

      <div className="mb-6">
        <Tabs items={abas} value={aba} onChange={(id) => navegar(id)} />
      </div>

      {aba === "visao-geral" && <VisaoGeralTab onNavegar={navegar} />}
      {aba === "checklist" && <ChecklistPagina />}
      {aba === "usuarios" && <UsuariosTab statusInicial={searchParams.get("status")} />}
      {aba === "setores" && <SetoresTab filtroInicial={searchParams.get("filtro")} />}
      {aba === "tickets" && <TicketsTab />}
      {aba === "notificacoes" && <NotificacoesTab />}
      {aba === "sistema" && <SistemaTab onNavegar={navegar} />}
    </main>
  );
}
