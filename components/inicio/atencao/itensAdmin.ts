import { Building2, Clock, HardDrive, PauseCircle, UserPlus } from "lucide-react";
import type { ResumoAdmin } from "@/lib/admin/visaoGeral";
import type { AlertaEspaco } from "@/lib/admin/armazenamento";
import type { NavegarAba } from "@/components/admin/abas";
import type { LinhaAtencaoDados } from "./LinhaAtencao";

export type DadosAtencaoAdmin = { resumo: ResumoAdmin | null; alertasEspaco: AlertaEspaco[]; onNavegar: NavegarAba };

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Itens só do admin: contagens gerais e alertas de espaço; entram depois dos pessoais. */
export function linhasAdmin({ resumo, alertasEspaco, onNavegar }: DadosAtencaoAdmin): LinhaAtencaoDados[] {
  const linhas: Array<LinhaAtencaoDados & { quantidade: number }> = resumo
    ? [
        {
          id: "admin-pendentes",
          quantidade: resumo.usuariosPendentes,
          texto: `${plural(resumo.usuariosPendentes, "usuário aguardando", "usuários aguardando")} aprovação`,
          detalhe: "Novos cadastros precisam ser aprovados.",
          icone: UserPlus,
          cor: "bg-blue-500/15 text-blue-400",
          chip: { texto: "Aprovação", cor: "info" },
          onAbrir: () => onNavegar("usuarios", { status: "pendente" }),
        },
        {
          id: "admin-atrasados",
          quantidade: resumo.ticketsAtrasados,
          texto: plural(resumo.ticketsAtrasados, "ticket atrasado", "tickets atrasados"),
          detalhe: "No geral, todos os setores.",
          icone: Clock,
          cor: "bg-rose-500/15 text-rose-400",
          chip: { texto: "Atrasados", cor: "danger" },
          onAbrir: () => onNavegar("tickets", { filtro: "atrasados" }),
        },
        {
          id: "admin-parados",
          quantidade: resumo.ticketsParados,
          texto: `${plural(resumo.ticketsParados, "ticket parado", "tickets parados")} há mais de 5 dias`,
          detalhe: "Sem movimentação recente.",
          icone: PauseCircle,
          cor: "bg-amber-500/15 text-amber-400",
          chip: { texto: "Parados", cor: "warning" },
          onAbrir: () => onNavegar("tickets", { filtro: "parados" }),
        },
        {
          id: "admin-setores",
          quantidade: resumo.setoresSemResponsavel,
          texto: plural(resumo.setoresSemResponsavel, "setor sem responsável", "setores sem responsável"),
          detalhe: "Defina um responsável para esses setores.",
          icone: Building2,
          cor: "bg-violet-500/15 text-violet-400",
          chip: { texto: "Setores", cor: "purple" },
          onAbrir: () => onNavegar("setores", { filtro: "sem-responsavel" }),
        },
      ]
    : [];

  const espaco = alertasEspaco.map((a) => ({
    id: `admin-espaco-${a.id}`,
    quantidade: a.percentual,
    texto: `${a.recurso} em ${a.percentual}% do limite do plano`,
    detalhe: "Veja o uso de espaço e as opções de limpeza.",
    icone: HardDrive,
    cor: a.percentual > 90 ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400",
    chip: { texto: "Espaço", cor: a.percentual > 90 ? ("danger" as const) : ("warning" as const) },
    onAbrir: () => onNavegar("sistema"),
  }));

  return [...linhas, ...espaco].filter((l) => l.quantidade > 0);
}
