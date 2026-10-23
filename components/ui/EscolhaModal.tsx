"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export type OpcaoEscolha = { value: string; label: string; grupo?: string };

type Props = {
  titulo: string;
  rotulo: string;
  opcoes: OpcaoEscolha[];
  rotuloContinuar?: string;
  onEscolher: (opcao: OpcaoEscolha) => void;
  onClose: () => void;
};

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

/** Escolha de um valor (select com grupos opcionais); a confirmação vem em seguida, com o resumo. */
export function EscolhaModal({ titulo, rotulo, opcoes, rotuloContinuar = "Continuar", onEscolher, onClose }: Props) {
  const [valor, setValor] = useState("");
  const escolhida = opcoes.find((o) => o.value === valor);
  const grupos = [...new Set(opcoes.map((o) => o.grupo ?? ""))];

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!escolhida} onClick={() => escolhida && onEscolher(escolhida)}>
            {rotuloContinuar}
          </Button>
        </>
      }
    >
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">{rotulo}</span>
        <select className={CAMPO} value={valor} onChange={(e) => setValor(e.target.value)}>
          <option value="" disabled>
            Selecione...
          </option>
          {grupos.map((grupo) =>
            grupo ? (
              <optgroup key={grupo} label={grupo}>
                {opcoes
                  .filter((o) => o.grupo === grupo)
                  .map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
              </optgroup>
            ) : (
              opcoes
                .filter((o) => !o.grupo)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))
            ),
          )}
        </select>
      </label>
    </Modal>
  );
}
