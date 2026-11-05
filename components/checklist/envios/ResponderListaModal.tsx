"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ChecklistEnvioLista } from "@/lib/types/shell";
import { CAMPO, Campo } from "../Campos";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { textoTarefas } from "./textosLote";

type Props = {
  envio: ChecklistEnvioLista;
  aceitar: boolean;
  /** Aceita: a RPC já passou a lista para o usuário; aqui só traz para a grade. */
  onAceita: (grupoId: string) => void;
  onClose: () => void;
};

/** Aceitar ou recusar uma lista recebida, com resposta opcional. */
export function ResponderListaModal({ envio, aceitar, onAceita, onClose }: Props) {
  const toast = useToast();
  const { listas, nomeDe } = useChecklistEnvios();
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    try {
      const resultado = await listas.responder(envio, aceitar, resposta.trim() || null);
      // "Outra pessoa já aceitou": o hook já avisou e tirou o card; aqui só fecha.
      if (resultado === "ja-aceita") onClose();
      if (resultado !== "ok") return;
      toast.success(aceitar ? `Lista "${envio.nome}" aceita.` : `Lista "${envio.nome}" recusada.`);
      if (aceitar && envio.grupo_id) onAceita(envio.grupo_id);
      onClose();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title={aceitar ? "Aceitar lista" : "Recusar lista"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant={aceitar ? "primary" : "danger"} onClick={confirmar} disabled={enviando}>
            {aceitar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {enviando ? "Enviando..." : aceitar ? "Aceitar" : "Recusar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/65">
          <span className="font-medium text-white">{envio.nome}</span> · {textoTarefas(envio.qtd_tarefas)} · de{" "}
          {nomeDe(envio.de_usuario_id)}
        </p>
        {aceitar && (
          <p className="text-xs text-white/50">
            A lista vai para o fim do seu checklist, com as tarefas do jeito que estão (status, prazos e repetição).
          </p>
        )}
        <Campo rotulo={aceitar ? "Resposta (opcional)" : "Motivo (opcional)"}>
          <textarea
            rows={3}
            className={`${CAMPO} resize-y`}
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
          />
        </Campo>
      </div>
    </Modal>
  );
}
