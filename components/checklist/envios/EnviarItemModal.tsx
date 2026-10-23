"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ChecklistItem } from "@/lib/types/shell";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { CamposEnvio, dadosDoEnvio, formEnvioInicial, textoDestino } from "./CamposEnvio";

type Props = { item: ChecklistItem; onClose: () => void };

/** "Enviar para…" de um item que já existe; a RPC guarda o título atual do item no envio. */
export function EnviarItemModal({ item, onClose }: Props) {
  const toast = useToast();
  const envios = useChecklistEnvios();
  const [form, setForm] = useState(() => formEnvioInicial(item.prazo));
  const [enviando, setEnviando] = useState(false);
  const dados = dadosDoEnvio(item.id, form);

  async function confirmar() {
    if (!dados || enviando) return;
    setEnviando(true);
    const ok = await envios.enviar(dados);
    setEnviando(false);
    if (!ok) return;
    toast.success(`Tarefa enviada para ${textoDestino(form, envios)}.`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title="Enviar para…"
      rolavel
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!dados || enviando}>
            <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="truncate text-sm text-white/65">
          Tarefa: <span className="font-medium text-white">{item.titulo}</span>
        </p>
        <CamposEnvio form={form} onChange={setForm} />
      </div>
    </Modal>
  );
}
