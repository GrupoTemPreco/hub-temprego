"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TextoCortado } from "@/components/ui/Tooltip";
import { NivelChip, UrgenciaChip } from "@/components/checklist/ItemChips";
import { STATUS_DESTINATARIO } from "@/components/checklist/envios/textosLote";
import { descricaoRecorrencia } from "@/lib/checklistDiarias";
import { origemDosCampos, type CamposOrigem } from "@/lib/checklistOrigem";
import { formatarDataHoraSP } from "@/lib/datas";
import type { ChecklistEnvio, ChecklistItem } from "@/lib/types/shell";
import { RecebidaDeTarefa } from "./RecebidaDe";

export type EnvioLeitura = Pick<
  ChecklistEnvio,
  "id" | "item_id" | "status" | "mensagem" | "resposta" | "criado_em" | "respondido_em" | "reenvios" | "reenviado_em"
> & {
  de_nome?: string | null;
  para_nome?: string | null;
};

type Props = {
  item: ChecklistItem & CamposOrigem;
  nomeLista: string;
  envios: EnvioLeitura[];
  onFechar: () => void;
};

function prazoLegivel(prazo: string | null) {
  if (!prazo) return "Sem prazo";
  const [ano, mes, dia] = prazo.split("-");
  if (!ano || !mes || !dia) return prazo;
  return `${dia}/${mes}/${ano}`;
}

function reenviosDe(envio: EnvioLeitura) {
  if (envio.reenvios <= 0) return null;
  const vezes = envio.reenvios === 1 ? "1 reenvio" : `${envio.reenvios} reenvios`;
  return envio.reenviado_em ? `${vezes}, último em ${formatarDataHoraSP(envio.reenviado_em)}` : vezes;
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-white/45">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-white/85">{children}</dd>
    </div>
  );
}

/** Detalhe da tarefa só para leitura. Quem abre decide onde encaixar (painel, modal). */
export function DetalheTarefaLeitura({ item, nomeLista, envios, onFechar }: Props) {
  const historico = envios
    .filter((envio) => envio.item_id === item.id)
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  const descricao = item.observacao?.trim();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white/80">Detalhe da tarefa</h3>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar detalhes da tarefa"
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        <TextoCortado as="h4" className="break-words text-base font-semibold text-white">
          {item.titulo}
        </TextoCortado>
        <RecebidaDeTarefa origem={origemDosCampos(item.recebida_de_nome, item.recebida_em)} />
        <Dado rotulo="Descrição">
          <p className="whitespace-pre-wrap">{descricao || "Sem descrição"}</p>
        </Dado>
        <dl className="grid grid-cols-2 gap-3">
          <Dado rotulo="Lista">{nomeLista}</Dado>
          <Dado rotulo="Prazo">{prazoLegivel(item.prazo)}</Dado>
          <Dado rotulo="Nível">{item.nivel != null ? <NivelChip nivel={item.nivel} /> : "—"}</Dado>
          <Dado rotulo="Urgência">{item.urgencia != null ? <UrgenciaChip urgencia={item.urgencia} /> : "—"}</Dado>
          <Dado rotulo="Criada em">{formatarDataHoraSP(item.criado_em)}</Dado>
          <Dado rotulo="Concluída em">{item.concluido_em ? formatarDataHoraSP(item.concluido_em) : "—"}</Dado>
          <Dado rotulo="Recorrência">{descricaoRecorrencia(item)}</Dado>
        </dl>
        {historico.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wide text-white/45">Histórico de envio</h4>
            <ul className="space-y-2">
              {historico.map((envio) => {
                const status = STATUS_DESTINATARIO[envio.status];
                const reenvios = reenviosDe(envio);
                return (
                  <li key={envio.id} className="space-y-1 rounded-lg border border-white/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs text-white/70">
                        {envio.de_nome ?? "—"} → {envio.para_nome ?? "—"}
                      </span>
                      <Badge variant={status.cor} className="shrink-0">
                        {status.texto}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50">
                      Enviado {formatarDataHoraSP(envio.criado_em)}
                      {reenvios ? ` · ${reenvios}` : ""}
                    </p>
                    {envio.mensagem && <p className="whitespace-pre-wrap text-sm text-white/75">{envio.mensagem}</p>}
                    {envio.respondido_em && (
                      <p className="whitespace-pre-wrap text-xs text-white/55">
                        Resposta em {formatarDataHoraSP(envio.respondido_em)}
                        {envio.resposta ? `: ${envio.resposta}` : ""}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
