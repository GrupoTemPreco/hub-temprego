"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { NOME_GRUPO_INICIAL } from "@/lib/checklist";
import { NIVEIS_ITEM, URGENCIAS_ITEM } from "@/lib/checklistOpcoes";
import type { ChecklistGrupo, ChecklistNivel, ChecklistUrgencia } from "@/lib/types/shell";
import type { AcoesChecklist } from "../useChecklistDados";
import { CAMPO, Campo, CampoSelect } from "../Campos";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { CamposEnvio, dadosDoEnvio, destinoDoForm, formEnvioInicial, textoDestino } from "./CamposEnvio";

type Props = {
  grupos: ChecklistGrupo[];
  acoes: AcoesChecklist;
  /** Id do grupo escolhido; sem grupos, cria "Minhas tarefas". */
  garantirGrupo: (grupoId: string | null) => Promise<string | null>;
  onClose: () => void;
};

export function NovaSolicitacaoModal({ grupos, acoes, garantirGrupo, onClose }: Props) {
  const toast = useToast();
  const envios = useChecklistEnvios();
  const [titulo, setTitulo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [nivel, setNivel] = useState<ChecklistNivel>(1);
  const [urgencia, setUrgencia] = useState<ChecklistUrgencia>(2);
  const [grupoId, setGrupoId] = useState<string | null>(grupos[0]?.id ?? null);
  const [envio, setEnvio] = useState(() => formEnvioInicial());
  const [enviando, setEnviando] = useState(false);
  const valido = titulo.trim().length > 0 && destinoDoForm(envio) !== null;

  async function confirmar() {
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      const destino = await garantirGrupo(grupoId);
      if (!destino) return;
      const item = await acoes.adicionarItem(destino, {
        titulo: titulo.trim(),
        observacao: observacao.trim() || null,
        nivel,
        urgencia,
      });
      if (!item) return;
      const dados = dadosDoEnvio(item.id, envio);
      const ok = dados ? await envios.enviar(dados) : false;
      if (!ok) {
        // Sem envio, a solicitação não faz sentido: desfaz o item criado.
        await acoes.removerItem(item.id);
        return;
      }
      toast.success(`Tarefa enviada para ${textoDestino(envio, envios)}.`);
      onClose();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      title="Enviar tarefa"
      size="lg"
      rolavel
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!valido || enviando}>
            <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Campo rotulo="Título">
            <input autoFocus className={CAMPO} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect rotulo="Nível" valor={nivel} opcoes={NIVEIS_ITEM} onChange={setNivel} />
            <CampoSelect rotulo="Urgência" valor={urgencia} opcoes={URGENCIAS_ITEM} onChange={setUrgencia} />
          </div>
          <Campo rotulo="Observação">
            <textarea
              rows={3}
              className={`${CAMPO} resize-y`}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </Campo>
          {grupos.length > 0 ? (
            <CampoSelect
              rotulo="Guardar na minha lista"
              valor={grupoId ?? grupos[0].id}
              opcoes={grupos.map((g) => ({ value: g.id, label: g.nome }))}
              onChange={setGrupoId}
            />
          ) : (
            <p className="text-xs text-white/50">A tarefa será guardada em uma nova lista &quot;{NOME_GRUPO_INICIAL}&quot;.</p>
          )}
        </div>
        <div className="space-y-4">
          <CamposEnvio form={envio} onChange={setEnvio} />
        </div>
      </div>
    </Modal>
  );
}
