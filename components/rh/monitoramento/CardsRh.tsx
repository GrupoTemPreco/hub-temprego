"use client";

import type { ReactNode } from "react";
import { AlertCircle, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { CardRolavel, TotalCard, VazioCard } from "@/components/ui/CardRolavel";
import {
  MIN_TAREFAS_COM_PRAZO,
  formatarPercentual,
  type MotivoAtencaoRh,
  type PontoAtencaoRh,
} from "@/lib/rhRegras";
import type { ResumoUsuarioRh } from "@/lib/rhMonitoramento";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function textoDoPonto({ motivo, quantidade: n }: PontoAtencaoRh) {
  switch (motivo) {
    case "vencidas":
      return plural(n, "tarefa vencida", "tarefas vencidas");
    case "criticas":
      return plural(n, "tarefa crítica pendente", "tarefas críticas pendentes");
    case "sem-resposta":
      return `Recebeu ${plural(n, "tarefa", "tarefas")} e não respondeu`;
    case "sem-acesso":
      return Number.isFinite(n) ? `Não abre o checklist há ${plural(n, "dia", "dias")}` : "Nunca abriu o checklist";
    case "prazo-baixo":
      return `Entregou ${n}% no prazo`;
  }
}

const CHIP: Record<MotivoAtencaoRh, { texto: string; cor: BadgeVariant }> = {
  vencidas: { texto: "Vencidas", cor: "danger" },
  criticas: { texto: "Críticas", cor: "danger" },
  "sem-resposta": { texto: "Sem resposta", cor: "warning" },
  "sem-acesso": { texto: "Sem acesso", cor: "warning" },
  "prazo-baixo": { texto: "Prazo", cor: "orange" },
};

type LinhaProps = { usuario: ResumoUsuarioRh; detalhe: string; extra: ReactNode; onAbrir: () => void };

function LinhaUsuario({ usuario, detalhe, extra, onAbrir }: LinhaProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/2 p-2.5 text-left transition-colors hover:bg-white/6"
      >
        <Avatar nome={usuario.nome} email={usuario.email} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white/90">{usuario.nome || usuario.email}</span>
          <span className="block truncate text-xs text-white/50">{detalhe}</span>
        </span>
        {extra}
      </button>
    </li>
  );
}

type PontosProps = { pontos: PontoAtencaoRh[]; onAbrir: (u: ResumoUsuarioRh) => void };

export function PontosAtencaoCard({ pontos, onAbrir }: PontosProps) {
  return (
    <CardRolavel
      altura="360"
      titulo={
        <>
          <AlertCircle className="h-4 w-4 text-rose-400" /> Pontos de atenção <TotalCard total={pontos.length} />
        </>
      }
    >
      {pontos.length === 0 ? (
        <VazioCard>Nenhum ponto de atenção.</VazioCard>
      ) : (
        <ul className="space-y-2">
          {pontos.map((p) => (
            <LinhaUsuario
              key={`${p.usuario.usuario_id}-${p.motivo}`}
              usuario={p.usuario}
              detalhe={textoDoPonto(p)}
              extra={
                <Badge variant={CHIP[p.motivo].cor} className="shrink-0">
                  {CHIP[p.motivo].texto}
                </Badge>
              }
              onAbrir={() => onAbrir(p.usuario)}
            />
          ))}
        </ul>
      )}
    </CardRolavel>
  );
}

type MaisEmDiaProps = { ranking: Array<{ usuario: ResumoUsuarioRh; fracao: number }>; onAbrir: (u: ResumoUsuarioRh) => void };

export function MaisEmDiaCard({ ranking, onAbrir }: MaisEmDiaProps) {
  return (
    <CardRolavel
      altura="360"
      titulo={
        <>
          <Trophy className="h-4 w-4 text-emerald-400" /> Mais em dia
        </>
      }
    >
      {ranking.length === 0 ? (
        <VazioCard>Ainda não há tarefas suficientes para comparar.</VazioCard>
      ) : (
        <ul className="space-y-2">
          {ranking.map(({ usuario, fracao }) => (
            <LinhaUsuario
              key={usuario.usuario_id}
              usuario={usuario}
              detalhe={`${plural(usuario.concluidas_com_prazo, "tarefa com prazo", "tarefas com prazo")} no período`}
              extra={
                <Badge variant="success" className="shrink-0">
                  {formatarPercentual(fracao)} no prazo
                </Badge>
              }
              onAbrir={() => onAbrir(usuario)}
            />
          ))}
        </ul>
      )}
      {ranking.length > 0 && (
        <p className="pt-3 text-center text-[11px] text-white/35">
          Só entra quem concluiu ao menos {MIN_TAREFAS_COM_PRAZO} tarefas com prazo no período.
        </p>
      )}
    </CardRolavel>
  );
}
