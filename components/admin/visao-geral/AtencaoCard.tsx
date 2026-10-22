"use client";

import type { ComponentType } from "react";
import { AlertCircle, Building2, ChevronRight, Clock, HardDrive, PauseCircle, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ResumoAdmin } from "@/lib/admin/visaoGeral";
import type { AlertaEspaco } from "@/lib/admin/armazenamento";
import type { AbaAdmin, NavegarAba } from "../abas";
import { CardRolavel } from "./CardRolavel";

type ItemAtencao = {
  id: string;
  quantidade: number;
  titulo: (n: number) => string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
  cor: string;
  aba: AbaAdmin;
  extras?: Record<string, string>;
};

function montarItens(resumo: ResumoAdmin): ItemAtencao[] {
  return [
    {
      id: "pendentes",
      quantidade: resumo.usuariosPendentes,
      titulo: (n) => `${n} ${n === 1 ? "usuário aguardando" : "usuários aguardando"} aprovação`,
      descricao: "Novos cadastros precisam ser aprovados.",
      icon: UserPlus,
      cor: "bg-blue-500/15 text-blue-400",
      aba: "usuarios",
      extras: { status: "pendente" },
    },
    {
      id: "atrasados",
      quantidade: resumo.ticketsAtrasados,
      titulo: (n) => `${n} ${n === 1 ? "ticket atrasado" : "tickets atrasados"}`,
      descricao: "Tickets que ultrapassaram o prazo de atendimento.",
      icon: Clock,
      cor: "bg-rose-500/15 text-rose-400",
      aba: "tickets",
      extras: { filtro: "atrasados" },
    },
    {
      id: "parados",
      quantidade: resumo.ticketsParados,
      titulo: (n) => `${n} ${n === 1 ? "ticket parado" : "tickets parados"} há mais de 5 dias`,
      descricao: "Sem movimentação recente.",
      icon: PauseCircle,
      cor: "bg-amber-500/15 text-amber-400",
      aba: "tickets",
      extras: { filtro: "parados" },
    },
    {
      id: "setores",
      quantidade: resumo.setoresSemResponsavel,
      titulo: (n) => `${n} ${n === 1 ? "setor sem responsável" : "setores sem responsável"}`,
      descricao: "Defina um responsável para esses setores.",
      icon: Building2,
      cor: "bg-violet-500/15 text-violet-400",
      aba: "setores",
      extras: { filtro: "sem-responsavel" },
    },
  ];
}

/** Banco ou Storage acima de 80% do limite do plano. */
function itensDeEspaco(alertas: AlertaEspaco[]): ItemAtencao[] {
  return alertas.map((a) => ({
    id: `espaco-${a.id}`,
    quantidade: a.percentual,
    titulo: (n) => `${a.recurso} em ${n}% do limite do plano`,
    descricao: "Veja o uso de espaço e as opções de limpeza.",
    icon: HardDrive,
    cor: a.percentual > 90 ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400",
    aba: "sistema",
  }));
}

type AtencaoCardProps = { resumo: ResumoAdmin | null; alertasEspaco?: AlertaEspaco[]; onNavegar: NavegarAba };

export function AtencaoCard({ resumo, alertasEspaco = [], onNavegar }: AtencaoCardProps) {
  const itens = [...(resumo ? montarItens(resumo) : []), ...itensDeEspaco(alertasEspaco)].filter((i) => i.quantidade > 0);

  return (
    <CardRolavel
      titulo={
        <>
          <AlertCircle className="h-4 w-4 text-rose-400" />
          Precisa da sua atenção
        </>
      }
    >
      {itens.length === 0 ? (
        <EmptyState compact title="Tudo em dia" description="Nenhuma pendência no momento." />
      ) : (
        <ul className="space-y-2">
          {itens.map(({ id, quantidade, titulo, descricao, icon: Icon, cor, aba, extras }) => (
            <li key={id}>
              <button
                onClick={() => onNavegar(aba, extras)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/2 p-3 text-left transition-colors hover:bg-white/6"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cor}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{titulo(quantidade)}</span>
                  <span className="block text-xs text-white/50">{descricao}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-white/40" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </CardRolavel>
  );
}
