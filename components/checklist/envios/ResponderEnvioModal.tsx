"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { NOME_GRUPO_INICIAL } from "@/lib/checklist";
import type { ChecklistEnvio, ChecklistGrupo } from "@/lib/types/shell";
import { CAMPO, Campo, CampoSelect } from "../Campos";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";

type Props = {
  envio: ChecklistEnvio;
  aceitar: boolean;
  grupos: ChecklistGrupo[];
  /** Id do grupo escolhido; sem grupos, cria "Minhas tarefas". */
  garantirGrupo: (grupoId: string | null) => Promise<string | null>;
  onRespondido: (envio: ChecklistEnvio) => void;
  onClose: () => void;
};

/** Aceitar escolhe grupo, prazo e resposta; recusar pede só o motivo. Quem move o item é a RPC. */
export function ResponderEnvioModal({ envio, aceitar, grupos, garantirGrupo, onRespondido, onClose }: Props) {
  const toast = useToast();
  const { responder, nomeDe } = useChecklistEnvios();
  const [grupoId, setGrupoId] = useState<string | null>(grupos[0]?.id ?? null);
  const [prazo, setPrazo] = useState(envio.prazo_sugerido ?? "");
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    try {
      const destino = aceitar ? await garantirGrupo(grupoId) : null;
      if (aceitar && !destino) return;
      const resultado = await responder({
        envioId: envio.id,
        aceitar,
        grupoId: destino,
        prazo: aceitar ? prazo || null : null,
        resposta: resposta.trim() || null,
      });
      // "Outra pessoa já aceitou": o provider já avisou e tirou o card; aqui só fecha.
      if (resultado === "ja-aceita") onClose();
      if (resultado !== "ok") return;
      toast.success(aceitar ? `Tarefa "${envio.titulo}" aceita.` : `Tarefa "${envio.titulo}" recusada.`);
      onRespondido(envio);
      onClose();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title={aceitar ? "Aceitar tarefa" : "Recusar tarefa"}
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
          <span className="font-medium text-white">{envio.titulo}</span> · de {nomeDe(envio.de_usuario_id)}
        </p>
        {aceitar && (
          <>
            {grupos.length > 0 ? (
              <CampoSelect
                rotulo="Colocar na lista"
                valor={grupoId ?? grupos[0].id}
                opcoes={grupos.map((g) => ({ value: g.id, label: g.nome }))}
                onChange={setGrupoId}
              />
            ) : (
              <p className="text-xs text-white/50">A tarefa vai para uma nova lista &quot;{NOME_GRUPO_INICIAL}&quot;.</p>
            )}
            <Campo rotulo="Prazo">
              <input type="date" className={CAMPO} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </Campo>
          </>
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
