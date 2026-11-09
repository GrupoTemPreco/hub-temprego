"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { mesmosDias } from "@/lib/checklistDiarias";
import type { ChecklistGrupo } from "@/lib/types/shell";
import { CampoRepetir, camposDaRepeticao, repeticaoDe, repeticaoValida, type Repeticao } from "./CampoRepetir";
import type { NovaRepeticaoLista } from "./repeticaoLista";

type Props = {
  grupo: ChecklistGrupo;
  /** Feitas da lista que não foram concluídas hoje. */
  qtdConcluidasAntesDeHoje: number;
  onSalvar: (nova: NovaRepeticaoLista) => Promise<boolean>;
  onClose: () => void;
};

type Confirmacao = { titulo: string; texto: string; rotulo: string; perigo: boolean };

function textoConcluidasAntes(qtd: number) {
  const quem = qtd === 1 ? "1 tarefa concluída" : `${qtd} tarefas concluídas`;
  const verbo = qtd === 1 ? "vai voltar como pendente" : "vão voltar como pendentes";
  return `${quem} antes de hoje ${verbo} na próxima ocorrência. Continuar?`;
}

/** Desligar, trocar os dias, e ligar com feitas antigas pedem confirmação. Ligar sem elas não. */
function confirmacaoPara(grupo: ChecklistGrupo, nova: NovaRepeticaoLista, qtdConcluidasAntesDeHoje: number): Confirmacao | null {
  if (!grupo.diaria && nova.diaria && qtdConcluidasAntesDeHoje > 0) {
    return {
      titulo: "Ligar repetição da lista?",
      texto: textoConcluidasAntes(qtdConcluidasAntesDeHoje),
      rotulo: "Continuar",
      perigo: false,
    };
  }
  if (grupo.diaria && !nova.diaria) {
    return {
      titulo: "Parar de repetir a lista?",
      texto: "Todas as tarefas desta lista deixam de repetir. As concluídas na ocorrência atual ficam concluídas; as outras ficam pendentes.",
      rotulo: "Parar de repetir",
      perigo: true,
    };
  }
  if (grupo.diaria && nova.diaria && !mesmosDias(grupo.dias_semana, nova.dias_semana)) {
    return {
      titulo: "Mudar os dias da lista?",
      texto: "Os novos dias valem para todas as tarefas desta lista, inclusive as que tinham dias próprios.",
      rotulo: "Mudar os dias",
      perigo: false,
    };
  }
  return null;
}

/** "Repetir lista…": mesmo campo das tarefas. Com repetição, todas as tarefas da lista ficam com os dias dela. */
export function RepetirListaModal({ grupo, qtdConcluidasAntesDeHoje, onSalvar, onClose }: Props) {
  const [repeticao, setRepeticao] = useState<Repeticao>(() => repeticaoDe(grupo));
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const nova = camposDaRepeticao(repeticao);
  const mudou = grupo.diaria !== nova.diaria || (nova.diaria && !mesmosDias(grupo.dias_semana, nova.dias_semana));

  async function gravar() {
    setSalvando(true);
    const ok = await onSalvar(nova);
    setSalvando(false);
    if (ok) onClose();
  }

  function salvar() {
    if (!mudou) return onClose();
    const pedir = confirmacaoPara(grupo, nova, qtdConcluidasAntesDeHoje);
    if (pedir) setConfirmacao(pedir);
    else void gravar();
  }

  const fechar = salvando ? () => {} : onClose;

  if (confirmacao) {
    return (
      <Modal
        open
        size="sm"
        onClose={fechar}
        title={confirmacao.titulo}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmacao(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button variant={confirmacao.perigo ? "danger" : "primary"} onClick={gravar} disabled={salvando}>
              {salvando ? "Salvando..." : confirmacao.rotulo}
            </Button>
          </>
        }
      >
        <p className="text-sm text-texto/70">{confirmacao.texto}</p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      size="sm"
      onClose={fechar}
      title={`Repetir lista "${grupo.nome}"`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !repeticaoValida(repeticao)}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <CampoRepetir
        valor={repeticao}
        onChange={setRepeticao}
        disabled={salvando}
        dica={
          repeticao.modo === "nao"
            ? "As tarefas da lista não repetem."
            : "Todas as tarefas da lista passam a repetir nesses dias. Cada tarefa ainda pode ter dias próprios."
        }
      />
    </Modal>
  );
}
