import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { Notificacao, NotificacaoNivel } from "@/lib/types/shell";

export type NotificacaoConteudo = Pick<Notificacao, "titulo" | "mensagem" | "nivel">;

export const ESTILOS_NIVEL: Record<
  NotificacaoNivel,
  { icone: typeof Info; caixa: string; iconeCor: string; botao: string }
> = {
  informacao: {
    icone: Info,
    caixa: "border-sky-400/40 bg-sky-950/95 text-sky-50",
    iconeCor: "text-sky-300",
    botao: "bg-sky-600 hover:bg-sky-500",
  },
  sucesso: {
    icone: CheckCircle2,
    caixa: "border-emerald-400/40 bg-emerald-950/95 text-emerald-50",
    iconeCor: "text-emerald-300",
    botao: "bg-emerald-600 hover:bg-emerald-500",
  },
  atencao: {
    icone: AlertTriangle,
    caixa: "border-amber-400/40 bg-amber-950/95 text-amber-50",
    iconeCor: "text-amber-300",
    botao: "bg-amber-600 hover:bg-amber-500",
  },
  critico: {
    icone: AlertOctagon,
    caixa: "border-rose-400/40 bg-rose-950/95 text-rose-50",
    iconeCor: "text-rose-300",
    botao: "bg-rose-600 hover:bg-rose-500",
  },
};
