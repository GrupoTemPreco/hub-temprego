"use client";

import { useState } from "react";
import { BarChart3, ClipboardCheck, KeyRound, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { agruparPermissoes, type PermissaoKey } from "@/lib/permissoes";
import type { MudancaPermissao } from "@/lib/admin/usuariosMassa";

const ICONES: Record<string, typeof KeyRound> = { analytics: BarChart3, checklist: ClipboardCheck, rh: Users };
const GRUPOS = agruparPermissoes();

type Estado = "manter" | MudancaPermissao;

const ESTADOS: Array<{ value: Estado; label: string; ativo: string }> = [
  { value: "manter", label: "Manter", ativo: "bg-white/15 text-white" },
  { value: "conceder", label: "Conceder", ativo: "bg-emerald-600 text-white" },
  { value: "remover", label: "Remover", ativo: "bg-rose-600 text-white" },
];

type Mudancas = Partial<Record<PermissaoKey, MudancaPermissao>>;

type Props = { onEscolher: (mudancas: Mudancas) => void; onClose: () => void };

/** Catálogo agrupado por departamento; cada permissão começa em "Manter". */
export function PermissoesMassaModal({ onEscolher, onClose }: Props) {
  const [mudancas, setMudancas] = useState<Mudancas>({});
  const total = Object.keys(mudancas).length;

  function definir(key: PermissaoKey, estado: Estado) {
    setMudancas((prev) => {
      const novo = { ...prev };
      if (estado === "manter") delete novo[key];
      else novo[key] = estado;
      return novo;
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Permissões em massa"
      rolavel
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={total === 0} onClick={() => onEscolher(mudancas)}>
            Continuar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {GRUPOS.map((grupo) => {
          const Icon = ICONES[grupo.modulo] ?? KeyRound;
          return (
            <div key={grupo.modulo} className="rounded-lg border border-white/10">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">{grupo.titulo}</span>
              </div>
              <ul className="divide-y divide-white/5">
                {grupo.itens.map((p) => {
                  const atual: Estado = mudancas[p.key] ?? "manter";
                  return (
                    <li key={p.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="text-sm text-white/80">{p.itemLabel}</span>
                      <div role="radiogroup" aria-label={p.label} className="flex rounded-md border border-white/10 p-0.5">
                        {ESTADOS.map((e) => (
                          <button
                            key={e.value}
                            type="button"
                            role="radio"
                            aria-checked={atual === e.value}
                            onClick={() => definir(p.key, e.value)}
                            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                              atual === e.value ? e.ativo : "text-white/55 hover:text-white"
                            }`}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
