"use client";

import { Info } from "lucide-react";
import {
  anexosDeTicketsEncerrados,
  arquivosOrfaos,
  esvaziarLixeira,
  logAdminAntigo,
  notificacoesEncerradas,
} from "@/lib/admin/limpeza";
import { LimpezaCard } from "./LimpezaCard";

export function LimpezaSecao({ onConcluido }: { onConcluido: () => void }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Limpeza</h2>

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        O histórico dos tickets (mensagens e eventos) não é apagado por estas ações, exceto quando o ticket é excluído
        definitivamente.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LimpezaCard
          titulo="Anexos de tickets encerrados"
          descricao="Apaga do Storage os arquivos de tickets resolvidos, recusados ou fechados há mais de N dias. O registro do anexo continua no ticket, marcado como removido."
          acao={anexosDeTicketsEncerrados}
          diasPadrao={90}
          unidade={["anexo", "anexos"]}
          rotuloExecutar="Apagar anexos"
          onConcluido={onConcluido}
        />
        <LimpezaCard
          titulo="Arquivos órfãos"
          descricao="Arquivos do bucket tickets-anexos que não estão ligados a nenhum anexo de ticket."
          acao={arquivosOrfaos}
          unidade={["arquivo", "arquivos"]}
          rotuloExecutar="Apagar órfãos"
          onConcluido={onConcluido}
        />
        <LimpezaCard
          titulo="Esvaziar lixeira"
          descricao="Exclui definitivamente os tickets que estão na lixeira há mais de N dias (0 = todos), com seus arquivos e histórico."
          acao={esvaziarLixeira}
          diasPadrao={30}
          diasMinimo={0}
          unidade={["ticket", "tickets"]}
          rotuloExecutar="Esvaziar lixeira"
          onConcluido={onConcluido}
        />
        <LimpezaCard
          titulo="Notificações encerradas"
          descricao="Apaga notificações que terminaram há mais de N dias ou foram desativadas há mais de N dias. As leituras saem junto."
          acao={notificacoesEncerradas}
          diasPadrao={60}
          unidade={["notificação", "notificações"]}
          rotuloExecutar="Apagar notificações"
          onConcluido={onConcluido}
        />
        <LimpezaCard
          titulo="Log de ações do admin"
          descricao="Apaga registros do log de ações com mais de N dias. A própria limpeza fica registrada no log."
          acao={logAdminAntigo}
          diasPadrao={365}
          unidade={["registro", "registros"]}
          rotuloExecutar="Apagar registros"
          onConcluido={onConcluido}
        />
      </div>
    </section>
  );
}
