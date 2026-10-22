"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DestinoSelect } from "@/components/tickets/DestinoSelect";
import type { DestinoValor, Referencias, UsuarioReferencia } from "@/lib/ticketsApi";
import type { Ticket } from "@/lib/types/shell";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = {
  ticket: Ticket;
  referencias: Referencias;
  /** Quem aparece no grupo "Pessoas". Padrão: todos os usuários aprovados. */
  filtrarPessoa?: (usuario: UsuarioReferencia) => boolean;
  onClose: () => void;
  onConfirmar: (destino: DestinoValor, mensagem: string) => Promise<boolean>;
};

const aprovado = (u: UsuarioReferencia) => u.status === "aprovado";

export function EncaminharModal({ ticket, referencias, filtrarPessoa = aprovado, onClose, onConfirmar }: Props) {
  const [destino, setDestino] = useState<DestinoValor | "">("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const atual: DestinoValor | null = ticket.destino_setor_id
    ? `setor:${ticket.destino_setor_id}`
    : ticket.destino_usuario_id
      ? `usuario:${ticket.destino_usuario_id}`
      : null;

  async function confirmar() {
    if (!destino) return;
    setEnviando(true);
    const ok = await onConfirmar(destino, mensagem);
    setEnviando(false);
    if (ok) onClose();
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title={`Encaminhar ticket #${ticket.numero}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={enviando || !destino || destino === atual}>
            {enviando ? "Encaminhando..." : "Encaminhar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Novo destino</span>
          <DestinoSelect
            className={CAMPO}
            value={destino}
            onChange={setDestino}
            setores={referencias.setores.filter((s) => s.ativo)}
            pessoas={referencias.usuarios.filter(filtrarPessoa)}
          />
          {destino && destino === atual && (
            <span className="mt-1 block text-xs text-amber-300">Este já é o destino atual do ticket.</span>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Mensagem (opcional)</span>
          <textarea
            rows={3}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Explique o motivo do encaminhamento..."
            className={`${CAMPO} resize-none`}
          />
        </label>
      </div>
    </Modal>
  );
}
