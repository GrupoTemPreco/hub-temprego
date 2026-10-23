"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { ModoSetores } from "@/lib/admin/usuariosMassa";
import type { Setor } from "@/lib/types/shell";

const MODOS: Array<{ value: ModoSetores; label: string; descricao: string }> = [
  { value: "adicionar", label: "Adicionar a", descricao: "Mantém os setores atuais e inclui os escolhidos." },
  { value: "remover", label: "Remover de", descricao: "Tira só os setores escolhidos." },
  { value: "substituir", label: "Substituir por", descricao: "Os setores passam a ser exatamente os escolhidos." },
];

type Props = {
  setores: Setor[];
  onEscolher: (modo: ModoSetores, setores: Setor[]) => void;
  onClose: () => void;
};

export function SetoresMassaModal({ setores, onEscolher, onClose }: Props) {
  const ativos = setores.filter((s) => s.ativo);
  const [modo, setModo] = useState<ModoSetores>("adicionar");
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const escolhidos = ativos.filter((s) => marcados.has(s.id));
  // Substituir por nenhum setor equivale a tirar todos; nos outros modos, é preciso escolher algum.
  const valido = modo === "substituir" || escolhidos.length > 0;

  const alternar = (id: string) =>
    setMarcados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  return (
    <Modal
      open
      onClose={onClose}
      title="Setores em massa"
      rolavel
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!valido} onClick={() => onEscolher(modo, escolhidos)}>
            Continuar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div role="radiogroup" aria-label="Modo" className="grid gap-2 sm:grid-cols-3">
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={modo === m.value}
              onClick={() => setModo(m.value)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                modo === m.value ? "border-blue-500 bg-blue-600/20" : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span className="block text-sm font-medium text-white">{m.label}</span>
              <span className="block text-xs text-white/50">{m.descricao}</span>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm text-white/70">Setores ativos</p>
          {ativos.length === 0 ? (
            <p className="text-sm text-white/45">Nenhum setor ativo.</p>
          ) : (
            <ul className="max-h-60 divide-y divide-white/5 overflow-y-auto rounded-lg border border-white/10">
              {ativos.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={marcados.has(s.id)}
                      onChange={() => alternar(s.id)}
                      className="h-4 w-4 accent-blue-500"
                    />
                    {s.nome}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
