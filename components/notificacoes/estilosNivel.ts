import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { Notificacao, NotificacaoNivel } from "@/lib/types/shell";

export type NotificacaoConteudo = Pick<Notificacao, "titulo" | "mensagem" | "nivel">;

export const ESTILOS_NIVEL: Record<
  NotificacaoNivel,
  { icone: typeof Info; caixa: string; iconeCor: string; botao: string }
> = {
  informacao: {
    icone: Info,
    caixa: "border-sky-400/40 bg-semaforo-info-fundo text-semaforo-info-texto",
    iconeCor: "text-sky-300",
    botao: "bg-sky-600 hover:bg-sky-500",
  },
  sucesso: {
    icone: CheckCircle2,
    caixa: "border-emerald-400/40 bg-semaforo-sucesso-fundo text-semaforo-sucesso-texto",
    iconeCor: "text-emerald-300",
    botao: "bg-emerald-600 hover:bg-emerald-500",
  },
  atencao: {
    icone: AlertTriangle,
    caixa: "border-amber-400/40 bg-semaforo-atencao-fundo text-semaforo-atencao-texto",
    iconeCor: "text-amber-300",
    botao: "bg-amber-600 hover:bg-amber-500",
  },
  critico: {
    icone: AlertOctagon,
    caixa: "border-rose-400/40 bg-semaforo-critico-fundo text-semaforo-critico-texto",
    iconeCor: "text-rose-300",
    botao: "bg-rose-600 hover:bg-rose-500",
  },
};
