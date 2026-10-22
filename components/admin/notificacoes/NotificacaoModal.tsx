"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import {
  criarNotificacao,
  editarNotificacao,
  type DadosNotificacoes,
} from "@/lib/admin/notificacoes";
import type { Notificacao } from "@/lib/types/shell";
import { formDeNotificacao, formParaPayload, formVazio, validarForm, type ErrosForm, type NotificacaoForm } from "./notificacaoForm";
import { NotificacaoCamposConteudo } from "./NotificacaoCamposConteudo";
import { NotificacaoCamposAlcance } from "./NotificacaoCamposAlcance";
import { NotificacaoPreview } from "./NotificacaoPreview";

export type ModoModal = { tipo: "nova" } | { tipo: "editar"; notificacao: Notificacao } | { tipo: "duplicar"; notificacao: Notificacao };

type Props = {
  modo: ModoModal;
  dados: DadosNotificacoes;
  onClose: () => void;
  onSalvo: () => Promise<void>;
};

const TITULOS = { nova: "Criar notificação", editar: "Editar notificação", duplicar: "Duplicar notificação" };

export function NotificacaoModal({ modo, dados, onClose, onSalvo }: Props) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const [form, setForm] = useState<NotificacaoForm>(() =>
    modo.tipo === "nova" ? formVazio() : formDeNotificacao(modo.notificacao, modo.tipo === "duplicar"),
  );
  const [erros, setErros] = useState<ErrosForm>({});
  const [salvando, setSalvando] = useState(false);

  const jaTemLeituras =
    modo.tipo === "editar" && dados.leituras.some((l) => l.notificacao_id === modo.notificacao.id && l.visto_em);

  function set(parcial: Partial<NotificacaoForm>) {
    setForm((f) => ({ ...f, ...parcial }));
    setErros((e) => {
      const limpo = { ...e };
      for (const chave of Object.keys(parcial)) {
        if (chave === "setores_ids" || chave === "usuarios_ids") delete limpo.publico;
        else delete limpo[chave as keyof ErrosForm];
      }
      return limpo;
    });
  }

  async function salvar() {
    const encontrados = validarForm(form);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setSalvando(true);
    try {
      const payload = formParaPayload(form);
      if (modo.tipo === "editar") await editarNotificacao(modo.notificacao, payload);
      else await criarNotificacao(payload, usuario.id, modo.tipo === "duplicar" ? modo.notificacao : undefined);
      toast.success(modo.tipo === "editar" ? "Notificação atualizada." : "Notificação criada.");
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
      size="xl"
      rolavel
      onClose={salvando ? () => {} : onClose}
      title={TITULOS[modo.tipo]}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : modo.tipo === "editar" ? "Salvar alterações" : "Criar notificação"}
          </Button>
        </>
      }
    >
      {jaTemLeituras && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Quem já viu não verá de novo, a menos que você duplique como nova.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <NotificacaoCamposConteudo form={form} set={set} erros={erros} />
          <NotificacaoCamposAlcance form={form} set={set} erros={erros} dados={dados} />
        </div>
        <div className="lg:sticky lg:top-0 lg:self-start">
          <NotificacaoPreview form={form} />
        </div>
      </div>
    </Modal>
  );
}
