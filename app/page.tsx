"use client";

import { useState, useEffect } from "react";
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

const modulos = [
  { id: "analytics", label: "Analytics" },
  { id: "marketing", label: "Marketing" },
  { id: "dp", label: "DP" },
  { id: "rh", label: "RH" },
  { id: "financeiro", label: "Financeiro" },
];

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<(typeof todosApps)[0] | null>(null);
  const [permissoes, setPermissoes] = useState<{ modulo: string; item: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

      setPermissoes(data || []);
      setLoading(false);
    }

    init();
  }, [router]);

  function temPermissao(modulo: string, item: string) {
    return permissoes.some((p) => p.modulo === modulo && p.item === item);
  }

  const appsVisiveis = todosApps.filter((a) => temPermissao(a.modulo, a.item));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-52 flex-col border-r border-zinc-200 bg-white">
        <div className="p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Tempreço
          </p>

          {modulos.map((modulo) => {
            const itens = appsVisiveis.filter((a) => a.modulo === modulo.id);
            if (itens.length === 0) return null;

            return (
              <div key={modulo.id} className="mb-4">
                <p className="mb-1 px-3 text-xs font-semibold text-zinc-400">
                  {modulo.label}
                </p>
                {itens.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setActive(app)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      active?.id === app.id
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
                    }`}
                  >
                    {app.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-zinc-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex flex-1 flex-col">
        {active ? (
          <>
            <div className="flex h-11 items-center border-b border-zinc-200 bg-white px-4">
              <span className="text-sm font-medium text-zinc-700">
                {active.label}
              </span>
            </div>
            <iframe
              key={active.id}
              src={active.url}
              className="flex-1 w-full border-none"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-400">
              Selecione uma ferramenta no menu
            </p>
          </div>
        )}
      </main>
    </div>
  );
}