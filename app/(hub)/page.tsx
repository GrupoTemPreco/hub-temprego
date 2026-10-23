"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChecklistPagina } from "@/components/checklist/ChecklistPagina";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { ContadorChecklist } from "@/components/checklist/envios/ContadorChecklist";
import { ABA_CHECKLIST, rotaChecklist } from "@/lib/telaAtual";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { MenuIcon } from "@/components/hub/MenuIcon";
import { InicioUsuario } from "@/components/inicio/InicioUsuario";
import { buscarFerramenta, podeAcessar, srcIframe } from "@/lib/ferramentas";

function AvisoCompras({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3 sm:p-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-lg items-start gap-3 rounded-xl border border-emerald-400/35 bg-emerald-950/92 px-4 py-3 text-sm text-emerald-50 shadow-lg backdrop-blur-sm"
      >
        <p className="min-w-0 flex-1 leading-snug">
          Dados em validação. Valores podem variar até a conclusão da conferência.
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="shrink-0 rounded-md p-1 text-emerald-200/90 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fechar aviso"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function HomeMobile() {
  const usuario = useUsuarioAtual();
  const { ativa: active, abrir, fechar, irPara } = useFerramentaAtiva();
  const recebidos = useChecklistEnvios().recebidos.length;
  const aba = useSearchParams().get("aba");
  const abaChecklist = usuario.acessoChecklist && aba === ABA_CHECKLIST;
  const appChecklist = buscarFerramenta("checklist");
  const podeChecklist = podeAcessar(usuario, appChecklist);

  if (active && active.id !== "checklist") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#020617] px-6 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-20 w-20 shrink-0 text-white/45"
          aria-hidden
        >
          <rect x="2" y="4" width="20" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
        <p className="max-w-sm text-base text-white/70">Ferramenta disponivel somente em modo desktop</p>
        <button
          type="button"
          onClick={fechar}
          className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (active?.id === "checklist") {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#020617]">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={fechar}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Voltar
          </button>
        </header>
        <iframe
          key={active.id}
          src={srcIframe(active, usuario)}
          title={active.label}
          className="min-h-0 w-full flex-1 border-none"
        />
      </div>
    );
  }

  if (abaChecklist) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#020617] text-white">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={() => irPara("/")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Voltar
          </button>
          <h1 className="font-semibold">Checklist</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ChecklistPagina />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#020617] px-6">
      <img src="/logoA.png" alt="Logo Tempreço" className="h-16 w-16 object-contain opacity-90" />
      {usuario.acessoChecklist && (
        <button
          type="button"
          onClick={() => irPara(rotaChecklist(false))}
          className="flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-white/15 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/25"
        >
          <MenuIcon kind="tarefas" className="h-7 w-7 shrink-0" />
          Checklist
          <ContadorChecklist total={recebidos} />
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (podeChecklist) abrir(appChecklist);
        }}
        title={podeChecklist ? appChecklist.label : "Sem permissão para acessar"}
        className={`flex w-full max-w-xs items-center justify-center gap-3 rounded-xl py-4 text-lg font-semibold transition-colors ${
          podeChecklist ? "bg-white/15 text-white hover:bg-white/25" : "cursor-not-allowed bg-white/5 text-white/35"
        }`}
      >
        <MenuIcon kind="checklist" className="h-7 w-7 shrink-0" />
        {appChecklist.label}
      </button>
    </div>
  );
}

function HomeConteudo() {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const { ativa: active } = useFerramentaAtiva();
  const isMobile = useIsMobile();
  const redirecionarAdmin = usuario.isAdmin && !active;

  useEffect(() => {
    if (!redirecionarAdmin) return;
    // Leva junto ?ticket=, ?aba= e ?item= para o Início do admin.
    router.replace(`/admin${window.location.search}`);
  }, [redirecionarAdmin, router]);
  const [avisoComprasVisivel, setAvisoComprasVisivel] = useState(active?.id === "compras");
  const [idAnterior, setIdAnterior] = useState(active?.id);

  if (active?.id !== idAnterior) {
    setIdAnterior(active?.id);
    if (active?.id === "compras") setAvisoComprasVisivel(true);
  }

  if (redirecionarAdmin) return null;
  if (isMobile) return <HomeMobile />;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {active ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {active.id === "compras" && avisoComprasVisivel && (
            <AvisoCompras onFechar={() => setAvisoComprasVisivel(false)} />
          )}
          <iframe key={active.id} src={srcIframe(active, usuario)} className="min-h-0 w-full flex-1 border-none" />
        </div>
      ) : (
        <InicioUsuario />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeConteudo />
    </Suspense>
  );
}
