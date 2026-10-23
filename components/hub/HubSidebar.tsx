"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/useIsMobile";
import { calcularTelaAtual } from "@/lib/telaAtual";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { ContadorChecklist } from "@/components/checklist/envios/ContadorChecklist";
import { ITENS_ANALISES, ROTA_RH_MONITORAMENTO, buscarFerramenta, podeAcessar, podeMonitorarRh } from "@/lib/ferramentas";
import { useDestaquesMenu } from "./DestaquesMenuProvider";
import { PontoDestaque, SeloDestaque } from "./SeloDestaque";
import { useUsuarioAtual } from "./UsuarioAtualProvider";
import { useFerramentaAtiva } from "./FerramentaAtivaProvider";
import { MenuIcon, menuIconKindAnalise, type MenuIconKind } from "./MenuIcon";
import { SidebarDecoracao } from "./SidebarDecoracao";
const MENUS_INDISPONIVEIS: Array<{ label: string; icon: MenuIconKind }> = [
  { label: "RH", icon: "rh" },
  { label: "DP", icon: "dp" },
  { label: "Marketing", icon: "marketing" },
  { label: "Financeiro", icon: "financeiro" },
];

type EstadoItem = "ativo" | "normal" | "bloqueado";

function classeItemPrincipal(aberta: boolean, estado: EstadoItem) {
  const cor =
    estado === "ativo"
      ? "bg-white/15 text-white"
      : estado === "normal"
        ? "text-white/80 hover:bg-white/10 hover:text-white"
        : "cursor-not-allowed text-white/35";
  return `flex w-full items-center rounded-lg py-2 font-semibold transition-colors ${
    aberta ? "text-base" : "text-sm"
  } ${aberta ? "justify-between pl-1 pr-2" : "justify-center px-0"} ${cor}`;
}

export function HubSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const usuario = useUsuarioAtual();
  const isMobile = useIsMobile();
  const { ativa, abrir, irPara } = useFerramentaAtiva();
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarPin, setSidebarPin] = useState<"auto" | "open" | "closed">("auto");
  const [analisesAberto, setAnalisesAberto] = useState(false);

  const { destaqueDe } = useDestaquesMenu();
  const appChecklist = buscarFerramenta("checklist");
  const podeChecklist = podeAcessar(usuario, appChecklist);
  const destaqueChecklist = destaqueDe(appChecklist.id);
  const destaqueAnalises = ITENS_ANALISES.map((i) => destaqueDe(i.app.id)).find(Boolean);
  const naHome = pathname === "/";
  const noAdmin = pathname.startsWith("/admin");
  const noChecklist = calcularTelaAtual(pathname, ativa?.id ?? null, searchParams.get("aba")) === "checklist" && !ativa;
  const recebidosChecklist = useChecklistEnvios().recebidos.length;
  // Sem permissão de RH, a seção continua como "em breve" (desabilitada).
  const podeRh = podeMonitorarRh(usuario);
  const noMonitoramento = pathname.startsWith(ROTA_RH_MONITORAMENTO);
  const [rhAberto, setRhAberto] = useState(noMonitoramento);
  // No celular o checklist precisa da largura toda; a sidebar fica recolhida e abre ao tocar.
  const sidebarColapsavel = (naHome && Boolean(ativa)) || (noChecklist && isMobile);
  const sidebarAberta =
    sidebarPin === "open" ? true : sidebarPin === "closed" ? false : !sidebarColapsavel || sidebarHovered;
  const menuIconSize = sidebarAberta ? "h-5 w-5 shrink-0" : "h-6 w-6 shrink-0";
  const rotuloSpan = `flex items-center ${sidebarAberta ? "gap-2" : "justify-center"}`;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
      className={`relative flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#020617] transition-all duration-300 ${
        sidebarAberta ? "w-52" : "w-14"
      }`}
    >
      <div className={sidebarAberta ? "relative z-10 p-4" : "relative z-10 px-1 pt-4 pb-3"}>
        {sidebarAberta ? (
          <img
            src="/logoC.png"
            alt="Logo Tempreço"
            className="-ml-7 -mt-14 -mb-9 h-48 w-auto origin-left scale-118 object-contain pointer-events-none"
          />
        ) : (
          <img
            src="/logoA.png"
            alt="Logo Tempreço"
            className="mx-auto mb-5 h-11.5 w-11.5 object-contain pointer-events-none"
          />
        )}

        <div className={`flex flex-col gap-1 ${sidebarAberta ? "" : "items-center"}`}>
          {/* O contador de tarefas recebidas fica no Início, visível mesmo com outra ferramenta aberta. */}
          <button
            onClick={() => irPara(usuario.isAdmin ? "/admin" : "/")}
            title={usuario.isAdmin ? "Início Admin" : "Início"}
            className={classeItemPrincipal(sidebarAberta, (usuario.isAdmin ? noAdmin : naHome && !ativa) ? "ativo" : "normal")}
          >
            <span className={`relative ${rotuloSpan}`}>
              <MenuIcon kind={usuario.isAdmin ? "admin" : "inicio"} className={menuIconSize} />
              {sidebarAberta && (usuario.isAdmin ? "Início Admin" : "Início")}
              {!sidebarAberta && <ContadorChecklist total={recebidosChecklist} className="absolute -right-2 -top-1.5" />}
            </span>
            {sidebarAberta && <ContadorChecklist total={recebidosChecklist} />}
          </button>
          <button
            onClick={() => setAnalisesAberto((prev) => !prev)}
            className={classeItemPrincipal(sidebarAberta, "normal")}
            title="Análises"
          >
            <span className={`relative ${rotuloSpan}`}>
              <MenuIcon kind="analises" className={menuIconSize} />
              {sidebarAberta && "Análises"}
              {destaqueAnalises && (!sidebarAberta || !analisesAberto) && (
                <PontoDestaque
                  cor={destaqueAnalises.cor}
                  className={sidebarAberta ? "ml-0.5" : "absolute -right-1 -top-0.5"}
                />
              )}
            </span>
          </button>

          {sidebarAberta &&
            analisesAberto &&
            ITENS_ANALISES.map((item) => {
              const pode = podeAcessar(usuario, item.app);
              const selo = destaqueDe(item.app.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (pode) abrir(item.app);
                  }}
                  title={pode ? item.label : "Sem permissão para acessar"}
                  className={`w-full rounded-lg py-2 font-medium transition-colors ${
                    sidebarAberta ? "text-base" : "text-sm"
                  } ${sidebarAberta ? "pl-7 pr-1.5 text-left" : "px-0 text-center"} ${
                    naHome && ativa?.id === item.app.id
                      ? "bg-white/15 text-white"
                      : pode
                        ? "text-white/65 hover:bg-white/10 hover:text-white"
                        : "cursor-not-allowed text-white/35"
                  }`}
                >
                  <span
                    className={`flex w-full items-center ${sidebarAberta ? "min-w-0 gap-2" : "justify-center gap-2"}`}
                  >
                    <MenuIcon kind={menuIconKindAnalise(item.app.id)} className={menuIconSize} />
                    {sidebarAberta && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        {selo && <SeloDestaque texto={selo.texto} cor={selo.cor} />}
                      </>
                    )}
                  </span>
                </button>
              );
            })}

          <button
            onClick={() => {
              if (podeChecklist) abrir(appChecklist);
            }}
            title={podeChecklist ? appChecklist.label : "Sem permissão para acessar"}
            className={classeItemPrincipal(
              sidebarAberta,
              naHome && ativa?.id === appChecklist.id ? "ativo" : podeChecklist ? "normal" : "bloqueado",
            )}
          >
            <span className={`relative ${rotuloSpan}`}>
              <MenuIcon kind="checklist" className={menuIconSize} />
              {sidebarAberta && appChecklist.label}
              {destaqueChecklist && !sidebarAberta && (
                <PontoDestaque cor={destaqueChecklist.cor} className="absolute -right-1 -top-0.5" />
              )}
            </span>
            {destaqueChecklist && sidebarAberta && (
              <SeloDestaque texto={destaqueChecklist.texto} cor={destaqueChecklist.cor} />
            )}
          </button>

          {podeRh && (
            <>
              <button
                onClick={() => setRhAberto((prev) => !prev)}
                title="RH"
                aria-expanded={rhAberto}
                className={classeItemPrincipal(sidebarAberta, noMonitoramento && (!sidebarAberta || !rhAberto) ? "ativo" : "normal")}
              >
                <span className={rotuloSpan}>
                  <MenuIcon kind="rh" className={menuIconSize} />
                  {sidebarAberta && "RH"}
                </span>
              </button>
              {sidebarAberta && rhAberto && (
                <button
                  onClick={() => irPara(ROTA_RH_MONITORAMENTO)}
                  title="Monitoramento de tarefas"
                  className={`w-full rounded-lg py-2 pl-7 pr-1.5 text-left text-base font-medium transition-colors ${
                    noMonitoramento ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex w-full min-w-0 items-center gap-2">
                    <MenuIcon kind="monitoramento" className={menuIconSize} />
                    <span className="min-w-0 flex-1 truncate">Monitoramento de tarefas</span>
                  </span>
                </button>
              )}
            </>
          )}

          {MENUS_INDISPONIVEIS.filter((menu) => !(podeRh && menu.label === "RH")).map((menu) => (
            <button
              key={menu.label}
              disabled
              title="Ferramenta disponível em breve"
              className={`w-full cursor-not-allowed rounded-lg py-2 font-medium text-white/35 ${
                sidebarAberta ? "text-base" : "text-sm"
              } ${sidebarAberta ? "px-2 text-left" : "px-0 text-center"}`}
            >
              <span className={rotuloSpan}>
                <MenuIcon kind={menu.icon} className={menuIconSize} />
                {sidebarAberta && menu.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <SidebarDecoracao aberta={sidebarAberta} />

      <div className="relative z-10 mt-auto border-t border-white/10 bg-[#020617]/85 p-4 backdrop-blur-[2px]">
        <button
          onClick={() => setSidebarPin(sidebarPin === "auto" ? "open" : "auto")}
          className={`mb-2 flex w-full items-center justify-center rounded-lg py-1.5 transition-colors ${
            sidebarPin !== "auto"
              ? "bg-white/20 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          title={sidebarPin !== "auto" ? "Desfixar sidebar" : "Fixar sidebar aberta"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="m14 4 6 6-3 1-2 5-2-2-5 2-1-3-3-3z" />
            <path d="M12 14v6" />
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className={`w-full rounded-lg py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white ${
            sidebarAberta ? "px-3 text-left" : "px-2 text-center"
          }`}
        >
          {sidebarAberta ? "Sair" : "S"}
        </button>
      </div>
    </aside>
  );
}
