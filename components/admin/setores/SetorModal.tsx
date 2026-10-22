"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Combobox } from "@/components/ui/Combobox";
import { ChipsSelect } from "@/components/ui/ChipsSelect";
import type { Opcao } from "@/components/ui/OptionList";
import { useToast } from "@/components/ui/Toast";
import { NomeSetorDuplicadoError, salvarSetor, type SetorForm } from "@/lib/admin/salvarSetor";
import type { SetorLista, UsuarioOpcao } from "@/lib/admin/setores";

const CAMPO = "w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = {
  setor: SetorLista | null;
  usuarios: UsuarioOpcao[];
  onClose: () => void;
  onSalvo: () => Promise<void>;
};

function nomeUsuario(u: UsuarioOpcao | undefined) {
  return u?.nome || u?.email || "Usuário";
}

export function SetorModal({ setor, usuarios, onClose, onSalvo }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<SetorForm>({
    nome: setor?.nome ?? "",
    descricao: setor?.descricao ?? "",
    ativo: setor?.ativo ?? true,
    responsavel_id: setor?.responsavel_id ?? null,
    membros_ids: setor?.membros_ids ?? [],
  });
  const [erroNome, setErroNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const opcoes: Opcao[] = usuarios
    .filter((u) => u.status === "aprovado")
    .map((u) => ({ value: u.id, label: nomeUsuario(u), sublabel: u.email }));
  const labelDe = (id: string) => nomeUsuario(usuarios.find((u) => u.id === id));

  async function salvar() {
    if (!form.nome.trim()) {
      setErroNome("Informe o nome do setor.");
      return;
    }
    setSalvando(true);
    try {
      await salvarSetor(form, setor, usuarios);
      toast.success(setor ? "Setor atualizado." : "Setor criado.");
      await onSalvo();
      onClose();
    } catch (err) {
      if (err instanceof NomeSetorDuplicadoError) setErroNome(err.message);
      else toast.error(`Erro ao salvar setor: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open
      onClose={salvando ? () => {} : onClose}
      title={setor ? "Editar setor" : "Criar novo setor"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : setor ? "Salvar alterações" : "Criar setor"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">
            Nome do setor <span className="text-rose-400">*</span>
          </span>
          <input
            autoFocus
            value={form.nome}
            onChange={(e) => {
              setForm({ ...form, nome: e.target.value });
              setErroNome("");
            }}
            placeholder="Ex.: Comercial"
            className={`${CAMPO} ${erroNome ? "border-rose-500" : "border-white/10"}`}
          />
          {erroNome && <span className="mt-1 block text-xs text-rose-400">{erroNome}</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Descrição</span>
          <textarea
            rows={2}
            value={form.descricao ?? ""}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descreva o objetivo do setor..."
            className={`${CAMPO} resize-none border-white/10`}
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-white/70">Responsável</span>
          <Combobox
            opcoes={opcoes}
            value={form.responsavel_id}
            onChange={(v) => setForm({ ...form, responsavel_id: v })}
            placeholder="Selecione um usuário..."
            labelFallback={form.responsavel_id ? labelDe(form.responsavel_id) : undefined}
          />
          <span className="mt-1 block text-xs text-white/45">O responsável é adicionado aos membros ao salvar.</span>
        </div>

        <div>
          <span className="mb-1 block text-sm text-white/70">Membros</span>
          <ChipsSelect
            opcoes={opcoes}
            values={form.membros_ids}
            onChange={(v) => setForm({ ...form, membros_ids: v })}
            labelDe={labelDe}
            adicionarLabel="Adicionar membro"
          />
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-white/10 p-3">
          <Toggle label="Setor ativo" checked={form.ativo} onChange={(v) => setForm({ ...form, ativo: v })} />
          <div>
            <p className="text-sm font-medium">Setor ativo</p>
            <p className="text-xs text-white/50">
              Desativar não altera os tickets já existentes; apenas impede que o setor receba tickets novos.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
