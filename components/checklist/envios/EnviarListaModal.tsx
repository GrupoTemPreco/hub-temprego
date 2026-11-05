"use client";

import { useState } from "react";
import { Send, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ChecklistGrupo } from "@/lib/types/shell";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { CamposEnvio, destinoDoForm, formEnvioInicial, textoDestino, variosDestinos } from "./CamposEnvio";
import { textoTarefas } from "./textosLote";

type Props = {
  grupo: ChecklistGrupo;
  /** Todas as tarefas da lista, sem filtros. */
  qtdTarefas: number;
  compartilhada: boolean;
  onClose: () => void;
};

/** Mesmo modal do envio de tarefa, sem prazo. Quem aceitar primeiro fica com a lista e as tarefas dela. */
export function EnviarListaModal({ grupo, qtdTarefas, compartilhada, onClose }: Props) {
  const toast = useToast();
  const envios = useChecklistEnvios();
  const [form, setForm] = useState(() => formEnvioInicial());
  const [enviando, setEnviando] = useState(false);
  const destino = destinoDoForm(form);
  const todos = variosDestinos(form) && form.distribuicao === "todos";

  async function confirmar() {
    if (!destino || enviando) return;
    setEnviando(true);
    const ok = await envios.listas.enviar({
      grupoId: grupo.id,
      destino,
      mensagem: form.mensagem.trim() || null,
      modo: todos ? "todos" : "primeiro",
    });
    setEnviando(false);
    if (!ok) return;
    toast.success(`Lista enviada para ${textoDestino(form, envios)}.`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title={`Enviar lista "${grupo.nome}" (${textoTarefas(qtdTarefas)})`}
      rolavel
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!destino || enviando}>
            <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/65">
          As tarefas vão junto do jeito que estão.
          {todos ? "" : " Enquanto ninguém responde, a lista fica parada no seu checklist."}
        </p>
        {compartilhada && !todos && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Esta lista está compartilhada. Quando o envio for aceito, os membros deixam de vê-la.
          </p>
        )}
        <CamposEnvio form={form} onChange={setForm} lista />
      </div>
    </Modal>
  );
}
