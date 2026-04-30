"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const todosApps = [
  {
    id: "vendas",
    modulo: "analytics",
    item: "vendas",
    label: "Vendas",
    url: "https://dashboard-orpin-delta-58.vercel.app/",
  },
  {
    id: "financeiro",
    modulo: "analytics",
    item: "contas_a_pagar",
    label: "Contas a Pagar",
    url: "https://dashboard-financeiro-zeta.vercel.app/",
  },
];

function MenuIcon({
  kind,
  className,
}: {
  kind: "analises" | "comercial" | "financeiro" | "rh" | "dp" | "marketing" | "admin";
  className?: string;
}) {
  const common = className ?? "h-4 w-4 shrink-0";
  switch (kind) {
    case "analises":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 19h16" />
          <path d="M7 15V9" />
          <path d="M12 15V5" />
          <path d="M17 15v-3" />
        </svg>
      );
    case "comercial":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 9.5 12 4l9 5.5" />
          <path d="M5 10v8h14v-8" />
          <path d="M9 13h6" />
        </svg>
      );
    case "financeiro":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h4" />
        </svg>
      );
    case "rh":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M4 18c.6-2.2 2.4-3.5 4-3.5s3.4 1.3 4 3.5" />
          <path d="M12 18c.5-1.8 2-3 4-3s3.5 1.2 4 3" />
        </svg>
      );
    case "dp":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v3h3" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
    case "marketing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 11v2" />
          <path d="M7 9v6" />
          <path d="M11 7v10" />
          <path d="M15 10v4" />
          <path d="M19 6v12" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 3 4 7v6c0 4.5 3 7.8 8 9 5-1.2 8-4.5 8-9V7l-8-4Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      );
  }
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<(typeof todosApps)[0] | null>(null);
  const [permissoes, setPermissoes] = useState<{ modulo: string; item: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarPin, setSidebarPin] = useState<"auto" | "open" | "closed">("auto");
  const [analisesAberto, setAnalisesAberto] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("permissoes")
        .select("modulo, item")
        .eq("user_id", session.user.id);

      const { data: perfil } = await supabase
        .from("usuarios")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();

      setPermissoes(data || []);
      setIsAdmin(Boolean(perfil?.is_admin));
      setLoading(false);
    }

    init();
  }, [router]);

  function temPermissao(modulo: string, item: string) {
    return permissoes.some((p) => p.modulo === modulo && p.item === item);
  }

  const appComercial = todosApps.find((a) => a.id === "vendas");
  const appFinanceiro = todosApps.find((a) => a.id === "financeiro");
  type ItemAnalise = { id: string; label: string; app: (typeof todosApps)[0] };
  const itensAnalises = [
    appComercial ? { id: "comercial", label: "Comercial", app: appComercial } : null,
    appFinanceiro ? { id: "analise-financeiro", label: "Financeiro", app: appFinanceiro } : null,
  ].filter((item): item is ItemAnalise => {
    return Boolean(item);
  });
  const menusIndisponiveis = [
    { label: "RH", icon: "rh" as const },
    { label: "DP", icon: "dp" as const },
    { label: "Marketing", icon: "marketing" as const },
    { label: "Financeiro", icon: "financeiro" as const },
  ];
  const sidebarColapsavel = Boolean(active);
  const sidebarAberta =
    sidebarPin === "open"
      ? true
      : sidebarPin === "closed"
        ? false
        : !sidebarColapsavel || sidebarHovered;
  const menuIconSize = sidebarAberta ? "h-5 w-5 shrink-0" : "h-6 w-6 shrink-0";
  const decoNodes = [
    { left: "1%", bottom: "8%", size: "h-1.5 w-1.5", delay: 0, driftX: 10, driftY: -16 },
    { left: "4%", bottom: "14%", size: "h-1 w-1", delay: 0.1, driftX: -8, driftY: -13 },
    { left: "7%", bottom: "20%", size: "h-1.5 w-1.5", delay: 0.2, driftX: 9, driftY: -14 },
    { left: "10%", bottom: "26%", size: "h-1 w-1", delay: 0.3, driftX: -9, driftY: -12 },
    { left: "13%", bottom: "32%", size: "h-1.5 w-1.5", delay: 0.4, driftX: 10, driftY: -15 },
    { left: "16%", bottom: "38%", size: "h-1 w-1", delay: 0.5, driftX: -7, driftY: -11 },
    { left: "19%", bottom: "44%", size: "h-1.5 w-1.5", delay: 0.6, driftX: 8, driftY: -13 },
    { left: "22%", bottom: "50%", size: "h-1 w-1", delay: 0.7, driftX: -8, driftY: -10 },
    { left: "25%", bottom: "12%", size: "h-1.5 w-1.5", delay: 0.8, driftX: 9, driftY: -14 },
    { left: "28%", bottom: "18%", size: "h-1 w-1", delay: 0.9, driftX: -9, driftY: -12 },
    { left: "31%", bottom: "24%", size: "h-1.5 w-1.5", delay: 1, driftX: 10, driftY: -15 },
    { left: "34%", bottom: "30%", size: "h-1 w-1", delay: 1.1, driftX: -7, driftY: -10 },
    { left: "37%", bottom: "36%", size: "h-1.5 w-1.5", delay: 1.2, driftX: 8, driftY: -13 },
    { left: "40%", bottom: "42%", size: "h-1 w-1", delay: 1.3, driftX: -8, driftY: -11 },
    { left: "43%", bottom: "48%", size: "h-1.5 w-1.5", delay: 1.4, driftX: 9, driftY: -14 },
    { left: "46%", bottom: "54%", size: "h-1 w-1", delay: 1.5, driftX: -9, driftY: -12 },
    { left: "49%", bottom: "10%", size: "h-1.5 w-1.5", delay: 1.6, driftX: 10, driftY: -16 },
    { left: "52%", bottom: "16%", size: "h-1 w-1", delay: 1.7, driftX: -8, driftY: -12 },
    { left: "55%", bottom: "22%", size: "h-1.5 w-1.5", delay: 1.8, driftX: 9, driftY: -14 },
    { left: "58%", bottom: "28%", size: "h-1 w-1", delay: 1.9, driftX: -9, driftY: -11 },
    { left: "61%", bottom: "34%", size: "h-1.5 w-1.5", delay: 2, driftX: 8, driftY: -13 },
    { left: "64%", bottom: "40%", size: "h-1 w-1", delay: 2.1, driftX: -8, driftY: -10 },
    { left: "67%", bottom: "46%", size: "h-1.5 w-1.5", delay: 2.2, driftX: 9, driftY: -12 },
    { left: "70%", bottom: "52%", size: "h-1 w-1", delay: 2.3, driftX: -9, driftY: -11 },
    { left: "73%", bottom: "8%", size: "h-1.5 w-1.5", delay: 2.4, driftX: 10, driftY: -15 },
    { left: "76%", bottom: "14%", size: "h-1 w-1", delay: 2.5, driftX: -8, driftY: -12 },
    { left: "79%", bottom: "20%", size: "h-1.5 w-1.5", delay: 2.6, driftX: 9, driftY: -14 },
    { left: "82%", bottom: "26%", size: "h-1 w-1", delay: 2.7, driftX: -9, driftY: -11 },
    { left: "85%", bottom: "32%", size: "h-1.5 w-1.5", delay: 2.8, driftX: 8, driftY: -13 },
    { left: "88%", bottom: "38%", size: "h-1 w-1", delay: 2.9, driftX: -8, driftY: -10 },
    { left: "91%", bottom: "44%", size: "h-1.5 w-1.5", delay: 3, driftX: 9, driftY: -12 },
    { left: "94%", bottom: "50%", size: "h-1 w-1", delay: 3.1, driftX: -9, driftY: -11 },
    { left: "97%", bottom: "56%", size: "h-1.5 w-1.5", delay: 3.2, driftX: 8, driftY: -13 },
  ];
  const decoLines = [
    { left: "11%", bottom: "13%", width: "22%", rotate: -24, delay: 0.2 },
    { left: "18%", bottom: "20%", width: "20%", rotate: 18, delay: 0.7 },
    { left: "26%", bottom: "30%", width: "18%", rotate: -30, delay: 1.1 },
    { left: "34%", bottom: "18%", width: "26%", rotate: 12, delay: 1.6 },
    { left: "42%", bottom: "40%", width: "24%", rotate: -20, delay: 0.5 },
    { left: "50%", bottom: "26%", width: "20%", rotate: 16, delay: 2.1 },
    { left: "58%", bottom: "14%", width: "22%", rotate: -28, delay: 1.3 },
    { left: "22%", bottom: "44%", width: "18%", rotate: 8, delay: 1.8 },
    { left: "36%", bottom: "50%", width: "20%", rotate: -14, delay: 2.4 },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617]">
        <p className="text-sm text-zinc-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617]">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`relative flex flex-col overflow-hidden border-r border-white/10 bg-[#020617] transition-all duration-300 ${
          sidebarAberta ? "w-52" : "w-14"
        }`}
      >
        <div className={sidebarAberta ? "relative z-10 p-4" : "relative z-10 px-1 pt-4 pb-3"}>
          {sidebarAberta ? (
            <img
              src="/logoC.png"
              alt="Logo Tempreço"
              className="-ml-7 -mt-14 -mb-9 h-48 w-auto origin-left scale-[1.18] object-contain pointer-events-none"
            />
          ) : (
            <img
              src="/logoA.png"
              alt="Logo Tempreço"
              className="mx-auto mb-5 h-[46px] w-[46px] object-contain pointer-events-none"
            />
          )}

          <div className={`mb-4 ${sidebarAberta ? "" : "flex flex-col items-center"}`}>
            <button
              onClick={() => setAnalisesAberto((prev) => !prev)}
              className={`flex w-full items-center rounded-lg py-2 font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white ${
                sidebarAberta ? "text-base" : "text-sm"
              } ${
                sidebarAberta ? "justify-between pl-1 pr-2" : "justify-center px-0"
              }`}
              title="Análises"
            >
              <span className={`flex items-center ${sidebarAberta ? "gap-2" : "justify-center"}`}>
                <MenuIcon kind="analises" className={menuIconSize} />
                {sidebarAberta && "Análises"}
              </span>
            </button>

            {sidebarAberta &&
              analisesAberto &&
              itensAnalises.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (temPermissao(item.app.modulo, item.app.item)) {
                      setActive(item.app);
                    }
                  }}
                  title={
                    temPermissao(item.app.modulo, item.app.item)
                      ? item.label
                      : "Sem permissão para acessar"
                  }
                  className={`mt-1 w-full rounded-lg py-2 font-medium transition-colors ${
                    sidebarAberta ? "text-base" : "text-sm"
                  } ${
                    sidebarAberta ? "pl-7 pr-2 text-left" : "px-0 text-center"
                  } ${
                    active?.id === item.app.id
                      ? "bg-white/15 text-white"
                      : temPermissao(item.app.modulo, item.app.item)
                        ? "text-white/65 hover:bg-white/10 hover:text-white"
                        : "cursor-not-allowed text-white/35"
                  }`}
                >
                  <span className={`flex items-center ${sidebarAberta ? "gap-2" : "justify-center"}`}>
                    <MenuIcon
                      kind={item.id === "comercial" ? "comercial" : "financeiro"}
                      className={menuIconSize}
                    />
                    {sidebarAberta && item.label}
                  </span>
                </button>
              ))}
          </div>

          {isAdmin && (
            <div className="mb-3">
              <button
                onClick={() => router.push("/admin")}
                title="Admin"
                className={`w-full rounded-lg py-2 font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white ${
                  sidebarAberta ? "px-2 text-base text-left" : "px-0 text-sm text-center"
                }`}
              >
                <span className={`flex items-center ${sidebarAberta ? "gap-2" : "justify-center"}`}>
                  <MenuIcon kind="admin" className={menuIconSize} />
                  {sidebarAberta && "Admin"}
                </span>
              </button>
            </div>
          )}

          <div className={`space-y-1 ${sidebarAberta ? "" : "flex flex-col items-center"}`}>
            {menusIndisponiveis.map((menu) => (
              <button
                key={menu.label}
                disabled
                title="Ferramenta disponível em breve"
                className={`w-full cursor-not-allowed rounded-lg py-2 font-medium text-white/35 ${
                  sidebarAberta ? "text-base" : "text-sm"
                } ${
                  sidebarAberta ? "px-2 text-left" : "px-0 text-center"
                }`}
              >
                <span className={`flex items-center ${sidebarAberta ? "gap-2" : "justify-center"}`}>
                  <MenuIcon kind={menu.icon} className={menuIconSize} />
                  {sidebarAberta && menu.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 ${
            sidebarAberta ? "h-[52%]" : "h-[58%]"
          }`}
        >
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-cyan-400/25 via-cyan-300/10 to-transparent blur-2xl" />
          <div className="absolute inset-0 opacity-80 mask-[linear-gradient(to_top,black_0%,black_60%,transparent_100%)]">
            {decoLines.map((line, idx) => (
              <motion.span
                key={`fx-line-${idx}`}
                className="absolute block h-px bg-cyan-200/45"
                style={{
                  left: line.left,
                  bottom: line.bottom,
                  width: line.width,
                  transform: `rotate(${line.rotate}deg)`,
                  transformOrigin: "left center",
                }}
                animate={{
                  opacity: [0.2, 0.55, 0.25],
                  scaleX: [1, 1.06, 1],
                }}
                transition={{
                  duration: 4.2 + idx * 0.22,
                  delay: line.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          {decoNodes.map((dot, idx) => (
            <motion.span
              key={`fx-dot-${idx}`}
              className={`absolute rounded-full bg-cyan-200/80 ${dot.size}`}
              style={{ left: dot.left, bottom: dot.bottom, filter: "blur(0.5px)" }}
              animate={{
                x: [0, dot.driftX, 0],
                y: [0, dot.driftY, 0],
                opacity: [0.35, 1, 0.4],
                scale: [1, 1.3, 0.9, 1],
              }}
              transition={{
                duration: 2.4 + idx * 0.12,
                delay: dot.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {/* Logout */}
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

      {/* Conteúdo */}
      <main className="flex flex-1 flex-col">
        {active ? (
          <iframe
            key={active.id}
            src={active.url}
            className="flex-1 w-full border-none"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-white/60">
              Selecione uma ferramenta no menu
            </p>
          </div>
        )}
      </main>
    </div>
  );
}