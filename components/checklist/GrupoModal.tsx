"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { COR_GRUPO_PADRAO } from "@/lib/checklist";
import type { ChecklistCor } from "@/lib/types/shell";
import { SeletorCor } from "./SeletorCor";

type Props = {
  titulo: string;
  nomeInicial?: string;
  /** Sem cor inicial o seletor de cor não aparece (renomear). */
  corInicial?: ChecklistCor;
  rotuloSalvar?: string;
  onSalvar: (nome: string, cor: ChecklistCor) => Promise<boolean>;
  onClose: () => void;
};

/** Monte só quando for abrir, para o formulário começar sempre com os valores iniciais. */
export function GrupoModal({ titulo, nomeInicial = "", corInicial, rotuloSalvar = "Salvar", onSalvar, onClose }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [cor, setCor] = useState<ChecklistCor>(corInicial ?? COR_GRUPO_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const valido = nome.trim().length > 0;

  async function salvar() {
    if (!valido || salvando) return;
    setSalvando(true);
    const ok = await onSalvar(nome.trim(), cor);
    setSalvando(false);
    if (ok) onClose();
  }

  return (
    <Modal
      open
      onClose={salvando ? () => {} : onClose}
      title={titulo}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!valido || salvando}>
            {salvando ? "Salvando..." : rotuloSalvar}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void salvar();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Nome</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
            className="w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>
        {corInicial !== undefined && (
          <div>
            <span className="mb-2 block text-sm text-white/70">Cor</span>
            <SeletorCor valor={cor} onChange={setCor} />
          </div>
        )}
      </form>
    </Modal>
  );
}
