"use client";

import { MenuIcon, type MenuIconKind } from "@/components/hub/MenuIcon";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useDestaquesMenu } from "@/components/hub/DestaquesMenuProvider";
import { SeloDestaque } from "@/components/hub/SeloDestaque";
import { ITENS_ANALISES, buscarFerramenta, podeAcessar, type Ferramenta } from "@/lib/ferramentas";

type Atalho = { app: Ferramenta; label: string; descricao: string; icon: MenuIconKind };

const ATALHOS: Atalho[] = [
  ...ITENS_ANALISES.map((item) => ({
    app: item.app,
    label: item.label,
    descricao: `Análises · ${item.app.label}`,
    icon: item.app.id as MenuIconKind,
  })),
  {
    app: buscarFerramenta("checklist"),
    label: "Checklist",
    descricao: "Preencher e acompanhar checklists",
    icon: "checklist",
  },
];

export function AtalhosFerramentas() {
  const usuario = useUsuarioAtual();
  const { abrir } = useFerramentaAtiva();
  const { destaqueDe } = useDestaquesMenu();
  const disponiveis = ATALHOS.filter((a) => podeAcessar(usuario, a.app)).map((a) => ({
    ...a,
    selo: destaqueDe(a.app.id),
  }));

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Suas ferramentas</h2>

      {disponiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/55">
          Você ainda não tem acesso a nenhuma ferramenta. Fale com um administrador.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {disponiveis.map((atalho) => (
            <button
              key={atalho.app.id}
              type="button"
              onClick={() => abrir(atalho.app)}
              className="group relative flex items-center gap-4 rounded-xl border border-white/10 bg-white/3 p-4 text-left transition-colors hover:border-cyan-400/40 hover:bg-white/6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <MenuIcon kind={atalho.icon} className="h-6 w-6 shrink-0" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{atalho.label}</span>
                <span className="block truncate text-xs text-white/50">{atalho.descricao}</span>
              </span>
              {atalho.selo && (
                <SeloDestaque texto={atalho.selo.texto} cor={atalho.selo.cor} className="absolute right-3 top-3" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
