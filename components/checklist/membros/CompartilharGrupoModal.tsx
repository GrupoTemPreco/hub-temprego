"use client";

import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/Toggle";
import type { ChecklistGrupo, ChecklistMembro } from "@/lib/types/shell";
import { useChecklistEnvios } from "../envios/ChecklistEnviosProvider";
import { SeletorPessoa } from "../envios/SeletorPessoa";
import type { AcoesMembros } from "../useAcoesMembros";

type Props = {
  grupo: ChecklistGrupo;
  membros: ChecklistMembro[];
  acoes: AcoesMembros;
  onClose: () => void;
};

/** Só o dono abre: adiciona pessoas (aprovadas, com acesso ao checklist) e ajusta "Pode editar". */
export function CompartilharGrupoModal({ grupo, membros, acoes, onClose }: Props) {
  const { destinatarios, nomeDe } = useChecklistEnvios();
  const [pessoa, setPessoa] = useState<string | null>(null);
  const [podeEditar, setPodeEditar] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const jaMembros = new Set(membros.map((m) => m.usuario_id));
  const disponiveis = destinatarios.filter((p) => p.id !== grupo.dono_id && !jaMembros.has(p.id));

  async function executar(acao: () => Promise<boolean>) {
    setOcupado(true);
    const ok = await acao();
    setOcupado(false);
    return ok;
  }

  async function adicionar() {
    if (!pessoa) return;
    if (await executar(() => acoes.compartilhar(grupo.id, pessoa, podeEditar))) setPessoa(null);
  }

  return (
    <Modal open onClose={onClose} title={`Compartilhar lista "${grupo.nome}"`} rolavel footer={<Button onClick={onClose}>Pronto</Button>}>
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-white/80">Adicionar pessoa</h3>
          <SeletorPessoa pessoas={disponiveis} valor={pessoa} onChange={setPessoa} />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <Toggle label="Pode editar" checked={podeEditar} onChange={setPodeEditar} />
              Pode editar
            </label>
            <Button size="sm" onClick={adicionar} disabled={!pessoa || ocupado}>
              <UserPlus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-white/80">Membros ({membros.length})</h3>
          {membros.length === 0 ? (
            <p className="text-sm text-white/45">Ninguém além de você vê esta lista.</p>
          ) : (
            <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
              {membros.map((m) => (
                <li key={m.usuario_id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar nome={nomeDe(m.usuario_id)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/85">{nomeDe(m.usuario_id)}</span>
                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <Toggle
                      label={`Pode editar: ${nomeDe(m.usuario_id)}`}
                      checked={m.pode_editar}
                      disabled={ocupado}
                      onChange={(v) => void executar(() => acoes.alterarPodeEditar(grupo.id, m.usuario_id, v))}
                    />
                    Pode editar
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-300 hover:text-rose-200"
                    disabled={ocupado}
                    onClick={() => void executar(() => acoes.removerDoGrupo(grupo.id, m.usuario_id))}
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-white/45">Os membros veem todos os itens da lista, inclusive os que forem movidos para ela.</p>
        </section>
      </div>
    </Modal>
  );
}
