"use client";

import { Suspense, type ComponentType } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, ListChecks } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { ChecklistPagina } from "@/components/checklist/ChecklistPagina";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { ABA_CHECKLIST, rotaChecklist } from "@/lib/telaAtual";
import { SaudacaoUsuario } from "./SaudacaoUsuario";
import { MuralAvisos } from "./MuralAvisos";
import { LinhaInicio } from "./LinhaInicio";
import { AtalhosFerramentas } from "./AtalhosFerramentas";

/** Blocos do Início, empilhados nesta ordem. Para uma nova seção, crie o componente e inclua aqui. */
const SECOES: Array<{ id: string; Secao: ComponentType }> = [
  { id: "mural-avisos", Secao: MuralAvisos },
  { id: "cards", Secao: LinhaInicio },
  { id: "ferramentas", Secao: AtalhosFerramentas },
];

type AbaInicio = "visao-geral" | typeof ABA_CHECKLIST;

function VisaoGeral() {
  return (
    <div className="flex flex-col gap-8">
      {SECOES.map(({ id, Secao }) => (
        <Secao key={id} />
      ))}
    </div>
  );
}

/** Mesma barra de abas do Início do admin; só aparece para quem tem acesso ao checklist. */
function InicioComAbas() {
  const router = useRouter();
  const params = useSearchParams();
  const recebidos = useChecklistEnvios().recebidos.length;
  const aba: AbaInicio = params.get("aba") === ABA_CHECKLIST ? ABA_CHECKLIST : "visao-geral";
  const abas: TabItem<AbaInicio>[] = [
    { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
    { id: ABA_CHECKLIST, label: "Checklist", icon: ListChecks, count: recebidos },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        items={abas}
        value={aba}
        onChange={(id) => router.push(id === ABA_CHECKLIST ? rotaChecklist(false) : "/", { scroll: false })}
      />
      {aba === ABA_CHECKLIST ? <ChecklistPagina /> : <VisaoGeral />}
    </div>
  );
}

export function InicioUsuario() {
  const usuario = useUsuarioAtual();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-10">
        <SaudacaoUsuario nome={usuario.nome} />
        {usuario.acessoChecklist ? (
          <Suspense fallback={null}>
            <InicioComAbas />
          </Suspense>
        ) : (
          <VisaoGeral />
        )}
      </div>
    </div>
  );
}
