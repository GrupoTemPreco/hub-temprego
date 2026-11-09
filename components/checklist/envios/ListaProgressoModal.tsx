"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import type { LoteLista } from "@/lib/checklistEnviosLista";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { BotaoReenviarBase } from "./BotaoReenviar";
import { STATUS_DESTINATARIO, situacaoPessoaListaTodos } from "./textosLote";

const BOTAO =
  "inline-flex items-center gap-1.5 rounded-md border border-borda bg-superficie px-2.5 py-1 text-xs font-medium text-texto/85 hover:bg-superficie-hover";

type Props = { lote: LoteLista; onClose: () => void };

/** Progresso de um envio de lista no modo "todos": situação de cada pessoa, reenviar e cancelar pendentes. */
export function ListaProgressoModal({ lote, onClose }: Props) {
  const { nomeDe, listas } = useChecklistEnvios();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const progresso = listas.progressoDoLote(lote.id);

  async function cancelar() {
    setOcupado(true);
    const ok = await listas.cancelar(lote);
    setOcupado(false);
    if (!ok) return;
    setConfirmando(false);
    onClose();
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Progresso · ${lote.nome}`}
        footer={
          lote.pendentes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <BotaoReenviarBase
                ultimoEnvioEm={lote.ultimoEnvioEm}
                reenviar={() => listas.reenviar(lote)}
                textoOk="Lista reenviada."
                className={BOTAO}
              />
              <button type="button" className={`${BOTAO} text-rose-300`} onClick={() => setConfirmando(true)}>
                <Ban className="h-3.5 w-3.5" /> Cancelar envio
              </button>
            </div>
          ) : undefined
        }
      >
        <ul className="space-y-1.5">
          {lote.envios.map((e) => {
            const texto = situacaoPessoaListaTodos(e, progresso);
            return (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className={`truncate ${e.status === "recusado" ? "text-texto/45 line-through" : "text-texto/85"}`}>
                  {nomeDe(e.para_usuario_id)}
                </span>
                <Badge variant={STATUS_DESTINATARIO[e.status].cor} className="shrink-0 px-1.5 py-0 text-[11px]">
                  {texto}
                </Badge>
              </li>
            );
          })}
        </ul>
        {lote.mensagem && <p className="mt-3 text-sm text-texto/65">&ldquo;{lote.mensagem}&rdquo;</p>}
      </Modal>
      <ConfirmDialog
        open={confirmando}
        title="Cancelar envio?"
        description={`Só quem ainda não respondeu deixa de ver o pedido. Quem já aceitou fica com a cópia da lista "${lote.nome}".`}
        confirmLabel="Cancelar envio"
        danger
        loading={ocupado}
        onConfirm={cancelar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
