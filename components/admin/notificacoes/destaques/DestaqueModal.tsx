"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { FERRAMENTAS, rotuloFerramentaMenu } from "@/lib/ferramentas";
import { CORES_DESTAQUE, TEXTO_DESTAQUE_MAX, estiloCor, situacaoDestaque } from "@/lib/destaques";
import { agoraInputSP, inputSPParaIso, isoParaInputSP } from "@/lib/datas";
import { salvarDestaque } from "@/lib/admin/destaques";
import type { DestaqueCor, DestaqueMenu } from "@/lib/types/shell";
import { ItemMenuPreview } from "./ItemMenuPreview";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = {
  destaque: DestaqueMenu | null;
  todos: DestaqueMenu[];
  onClose: () => void;
  onSalvo: () => Promise<void>;
};

export function DestaqueModal({ destaque, todos, onClose, onSalvo }: Props) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const [form, setForm] = useState({
    ferramenta_id: destaque?.ferramenta_id ?? FERRAMENTAS[0].id,
    texto: destaque?.texto ?? "NOVO",
    cor: (destaque?.cor ?? "verde") as DestaqueCor,
    inicio: destaque ? isoParaInputSP(destaque.inicio_em) : agoraInputSP(),
    fim: destaque ? isoParaInputSP(destaque.fim_em) : agoraInputSP(15),
    semFim: destaque ? !destaque.fim_em : false,
    ativo: destaque?.ativo ?? true,
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = (parcial: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...parcial }));
    setErro("");
  };

  const concorrente = todos.find(
    (d) => d.id !== destaque?.id && d.ferramenta_id === form.ferramenta_id && situacaoDestaque(d) === "vigente",
  );

  async function salvar() {
    if (!form.texto.trim()) return setErro("Informe o texto do selo.");
    if (!form.inicio) return setErro("Informe o início.");
    if (!form.semFim && (!form.fim || inputSPParaIso(form.fim) <= inputSPParaIso(form.inicio))) {
      return setErro("O fim precisa ser depois do início.");
    }
    setSalvando(true);
    try {
      await salvarDestaque(
        {
          ferramenta_id: form.ferramenta_id,
          texto: form.texto.trim(),
          cor: form.cor,
          inicio_em: inputSPParaIso(form.inicio),
          fim_em: form.semFim ? null : inputSPParaIso(form.fim),
          ativo: form.ativo,
        },
        destaque,
        usuario.id,
      );
      toast.success(destaque ? "Destaque atualizado." : "Destaque criado.");
      await onSalvo();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={salvando ? () => {} : onClose}
      title={destaque ? "Editar destaque" : "Novo destaque"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : destaque ? "Salvar alterações" : "Criar destaque"}</Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Ferramenta</span>
            <select className={CAMPO} value={form.ferramenta_id} onChange={(e) => set({ ferramenta_id: e.target.value as typeof form.ferramenta_id })}>
              {FERRAMENTAS.map((f) => (
                <option key={f.id} value={f.id}>{rotuloFerramentaMenu(f.id)}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between text-sm text-white/70">
              Texto
              <span className="text-xs text-white/40">{form.texto.length}/{TEXTO_DESTAQUE_MAX}</span>
            </span>
            <input className={CAMPO} maxLength={TEXTO_DESTAQUE_MAX} value={form.texto} onChange={(e) => set({ texto: e.target.value })} />
          </label>

          <div>
            <span className="mb-1 block text-sm text-white/70">Cor</span>
            <div className="flex flex-wrap gap-2">
              {CORES_DESTAQUE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set({ cor: c.value })}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm ${
                    form.cor === c.value ? "border-blue-500 bg-blue-600/15" : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${estiloCor(c.value).ponto}`} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Início</span>
              <input type="datetime-local" className={CAMPO} value={form.inicio} onChange={(e) => set({ inicio: e.target.value })} />
            </label>
            <div>
              <span className="mb-1 block text-sm text-white/70">Fim</span>
              <input type="datetime-local" disabled={form.semFim} className={`${CAMPO} disabled:opacity-40`} value={form.semFim ? "" : form.fim} onChange={(e) => set({ fim: e.target.value })} />
              <label className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" checked={form.semFim} onChange={(e) => set({ semFim: e.target.checked, fim: e.target.checked ? form.fim : form.fim || agoraInputSP(15) })} />
                Sem data de fim
              </label>
            </div>
          </div>
          <p className="-mt-2 text-xs text-white/40">Horário de Brasília (America/Sao_Paulo).</p>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
            <Toggle label="Ativo" checked={form.ativo} onChange={(v) => set({ ativo: v })} />
            <span className="text-sm">Ativo</span>
          </div>

          {concorrente && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Já existe o destaque &quot;{concorrente.texto}&quot; vigente para {rotuloFerramentaMenu(form.ferramenta_id)}. O mais recente
              substitui o anterior na exibição.
            </p>
          )}
          {erro && <p className="text-sm text-rose-400">{erro}</p>}
        </div>

        <div>
          <span className="mb-1 block text-sm text-white/70">Pré-visualização</span>
          <ItemMenuPreview ferramentaId={form.ferramenta_id} texto={form.texto} cor={form.cor} />
        </div>
      </div>
    </Modal>
  );
}
