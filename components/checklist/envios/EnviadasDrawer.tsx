"use client";

import { useState } from "react";
import { Ban, Check, ChevronRight, Send } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAgora } from "@/hooks/useAgora";
import { formatarDataHoraSP } from "@/lib/datas";
import { formatarPrazo } from "@/lib/checklistRegras";
import { DIAS_ENVIADAS } from "@/lib/checklistEnvios";
import type { LoteEnvio } from "@/lib/checklistLotes";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { BotaoReenviar } from "./BotaoReenviar";
import { STATUS_DESTINATARIO, destinoDoLote, situacaoPessoaTodos, statusGeral } from "./textosLote";

const BOTAO =
  "inline-flex items-center gap-1.5 rounded-md border border-borda bg-superficie px-2.5 py-1 text-xs font-medium text-texto/85 hover:bg-superficie-hover";

/** Aguardando e respostas sem "Ok" aparecem mesmo que o envio seja anterior à janela de 30 dias. */
function naJanela(lote: LoteEnvio, agora: number) {
  const limite = agora - DIAS_ENVIADAS * 86_400_000;
  const semOk = lote.modo !== "todos" && (lote.status === "aceito" || lote.status === "recusado") && !lote.ciente;
  const todosAtivo = lote.modo === "todos" && lote.pendentes.length > 0;
  return lote.status === "aguardando" || semOk || todosAtivo || new Date(lote.criadoEm).getTime() >= limite;
}

/** Status de cada destinatário, com resposta e prazo quando houver. */
function DetalheDestinatarios({ lote }: { lote: LoteEnvio }) {
  const { nomeDe, progressoDoLote } = useChecklistEnvios();
  const progresso = lote.modo === "todos" ? progressoDoLote(lote.id) : [];
  return (
    <ul className="space-y-1.5 rounded-md bg-superficie p-2.5">
      {lote.envios.map((e) => (
        <li key={e.id} className="space-y-0.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-texto/85">{nomeDe(e.para_usuario_id)}</span>
            <Badge variant={STATUS_DESTINATARIO[e.status].cor} className="shrink-0 px-1.5 py-0 text-[11px]">
              {lote.modo === "todos" ? situacaoPessoaTodos(e, progresso) : STATUS_DESTINATARIO[e.status].texto}
            </Badge>
          </div>
          {e.resposta && <p className="text-texto/65">&ldquo;{e.resposta}&rdquo;</p>}
          {e.prazo_resposta && <p className="text-texto-suave">Prazo combinado: {formatarPrazo(e.prazo_resposta)}</p>}
        </li>
      ))}
    </ul>
  );
}

function LinhaLote({ lote, onCancelar }: { lote: LoteEnvio; onCancelar: (lote: LoteEnvio) => void }) {
  const envios = useChecklistEnvios();
  const [aberto, setAberto] = useState(false);
  const status = statusGeral(lote, envios, lote.modo === "todos" ? envios.progressoDoLote(lote.id) : []);
  const semOk = lote.modo !== "todos" && (lote.status === "aceito" || lote.status === "recusado") && !lote.ciente;
  const comPendentes = lote.status === "aguardando" || (lote.modo === "todos" && lote.pendentes.length > 0);

  return (
    <li className="space-y-2 px-5 py-3">
      <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="w-full space-y-1 text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-texto">
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-texto/45 transition-transform ${aberto ? "rotate-90" : ""}`} />
            <span className="truncate">{lote.titulo}</span>
          </span>
          <Badge variant={status.cor} className="shrink-0">
            {status.texto}
          </Badge>
        </span>
        <span className="block pl-5 text-xs text-texto-suave">
          Para {destinoDoLote(lote, envios)} · {formatarDataHoraSP(lote.criadoEm)}
          {lote.reenvios > 0 && ` · reenviada ${lote.reenvios}x`}
        </span>
      </button>

      {aberto && <DetalheDestinatarios lote={lote} />}

      {(semOk || comPendentes) && (
        <div className="flex flex-wrap gap-2 pl-5">
          {semOk && (
            <button type="button" className={BOTAO} onClick={() => void envios.marcarCiente(lote)}>
              <Check className="h-3.5 w-3.5" /> Ok
            </button>
          )}
          {comPendentes && (
            <>
              <BotaoReenviar lote={lote} className={BOTAO} />
              <button type="button" className={`${BOTAO} text-rose-300`} onClick={() => onCancelar(lote)}>
                <Ban className="h-3.5 w-3.5" /> Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

type Props = { onCancelar: (lote: LoteEnvio) => void; onClose: () => void };

/** Uma linha por envio (lote); clicar mostra cada destinatário. */
export function EnviadasDrawer({ onCancelar, onClose }: Props) {
  const { lotes } = useChecklistEnvios();
  const agora = useAgora(60_000);
  const lista = lotes.filter((l) => naJanela(l, agora));

  return (
    <Drawer open onClose={onClose} title={`Enviadas · últimos ${DIAS_ENVIADAS} dias`} width="max-w-lg">
      {lista.length === 0 ? (
        <EmptyState icon={Send} title="Nenhuma tarefa enviada" description="As tarefas que você enviar aparecem aqui." />
      ) : (
        <ul className="divide-y divide-borda">
          {lista.map((lote) => (
            <LinhaLote key={lote.id} lote={lote} onCancelar={onCancelar} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
