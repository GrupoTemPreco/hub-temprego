"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NIVEIS_COM_NENHUM, STATUS_ITEM, URGENCIAS_COM_NENHUM } from "@/lib/checklistOpcoes";
import { mesmosDias } from "@/lib/checklistDiarias";
import type { CamposItem } from "@/lib/checklist";
import type {
  ChecklistGrupo,
  ChecklistItem,
  ChecklistNivel,
  ChecklistStatus,
  ChecklistUrgencia,
} from "@/lib/types/shell";
import { CAMPO, Campo, CampoSelect } from "./Campos";
import { CampoRepetir, camposDaRepeticao, repeticaoDe, repeticaoValida, type Repeticao } from "./CampoRepetir";
import { useAcoesEnvioItem } from "./envios/AcoesEnvioItem";
import { ItemDrawerEnvio } from "./envios/ItemDrawerEnvio";
import { RecebidaDeTarefa } from "./RecebidaDe";
import { useChecklistEnvios } from "./envios/ChecklistEnviosProvider";

type Form = {
  titulo: string;
  observacao: string;
  grupo_id: string;
  status: ChecklistStatus;
  nivel: ChecklistNivel | null;
  urgencia: ChecklistUrgencia | null;
  prazo: string;
  fixado: boolean;
  repeticao: Repeticao;
};

function formDe(item: ChecklistItem): Form {
  return {
    titulo: item.titulo,
    observacao: item.observacao ?? "",
    grupo_id: item.grupo_id,
    status: item.status,
    nivel: item.nivel,
    urgencia: item.urgencia,
    prazo: item.prazo ?? "",
    fixado: item.fixado,
    repeticao: repeticaoDe(item),
  };
}

function camposAlterados(item: ChecklistItem, form: Form): CamposItem {
  const repetir = camposDaRepeticao(form.repeticao);
  const depois: CamposItem = {
    titulo: form.titulo.trim(),
    observacao: form.observacao.trim() || null,
    grupo_id: form.grupo_id,
    status: form.status,
    nivel: form.nivel,
    urgencia: form.urgencia,
    prazo: form.prazo || null,
    fixado: form.fixado,
    diaria: repetir.diaria,
  };
  const campos = Object.fromEntries(
    Object.entries(depois).filter(([campo, valor]) => item[campo as keyof ChecklistItem] !== valor),
  ) as CamposItem;
  if (!mesmosDias(item.dias_semana, repetir.dias_semana)) campos.dias_semana = repetir.dias_semana;
  if (form.grupo_id !== item.grupo_id) {
    campos.diaria = repetir.diaria;
    campos.dias_semana = repetir.dias_semana;
  }
  return campos;
}

type Props = {
  item: ChecklistItem;
  /** Grupos para onde o item pode ser movido (os que o usuário pode editar). */
  grupos: ChecklistGrupo[];
  /** Grupo compartilhado só para leitura. */
  somenteLeitura?: boolean;
  onClose: () => void;
  onSalvar: (campos: CamposItem) => Promise<boolean>;
  onExcluir: () => Promise<boolean>;
};

/** Use `key={item.id}` para o formulário recomeçar ao trocar de item. */
export function ItemDrawer({ item, grupos, somenteLeitura: grupoSoLeitura = false, onClose, onSalvar, onExcluir }: Props) {
  const { origemDaTarefa } = useChecklistEnvios();
  const envios = useAcoesEnvioItem();
  const situacao = envios?.situacao(item) ?? null;
  const somenteLeitura = grupoSoLeitura || situacao?.tipo === "aguardando";
  const [form, setForm] = useState<Form>(() => formDe(item));
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const alterar = (mudancas: Partial<Form>) => setForm((f) => ({ ...f, ...mudancas }));
  const listaDoFormulario = Boolean(grupos.find((g) => g.id === form.grupo_id)?.diaria);
  const segueLista = item.diaria || Boolean(grupos.find((g) => g.id === item.grupo_id)?.diaria);

  async function salvar() {
    const campos = camposAlterados(item, form);
    if (Object.keys(campos).length === 0) return onClose();
    setSalvando(true);
    const ok = await onSalvar(campos);
    setSalvando(false);
    if (ok) onClose();
  }

  async function excluir() {
    setSalvando(true);
    const ok = await onExcluir();
    setSalvando(false);
    if (ok) onClose();
  }

  const rodape = somenteLeitura ? (
    <div className="flex justify-end px-5 py-3">
      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
      <div className="flex gap-1">
        <Button variant="ghost" className="text-rose-300 hover:text-rose-200" onClick={() => setConfirmandoExclusao(true)}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
        {envios && item.status !== "feito" && !(situacao?.tipo === "todos" && situacao.lote.pendentes.length > 0) && (
          <Button
            variant="ghost"
            disabled={segueLista}
            title={segueLista ? "Tarefa recorrente não pode ser enviada" : undefined}
            onClick={() => envios.enviar(item)}
          >
            <Send className="h-4 w-4" /> Enviar para…
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={salvar} disabled={salvando || !form.titulo.trim() || !repeticaoValida(form.repeticao)}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );

  return (
    <Drawer open onClose={onClose} title="Item do checklist" footer={rodape} width="max-w-lg">
      <div className="space-y-4 p-5">
        {situacao && <ItemDrawerEnvio situacao={situacao} />}
        <RecebidaDeTarefa origem={origemDaTarefa(item.id)} />

        <fieldset disabled={somenteLeitura} className="space-y-4 disabled:opacity-70">
          <Campo rotulo="Título">
            <input className={CAMPO} value={form.titulo} onChange={(e) => alterar({ titulo: e.target.value })} />
          </Campo>

          <Campo rotulo="Observação">
            <textarea
              rows={4}
              className={`${CAMPO} resize-y`}
              value={form.observacao}
              onChange={(e) => alterar({ observacao: e.target.value })}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              rotulo="Lista"
              valor={form.grupo_id}
              opcoes={grupos.map((g) => ({ value: g.id, label: g.nome }))}
              onChange={(grupo_id) => {
                const destino = grupos.find((g) => g.id === grupo_id);
                const origemDiaria = Boolean(grupos.find((g) => g.id === item.grupo_id)?.diaria);
                if (destino?.diaria && form.repeticao.modo === "nao") alterar({ grupo_id, repeticao: repeticaoDe(destino) });
                else if (!destino?.diaria && origemDiaria) alterar({ grupo_id, repeticao: { ...form.repeticao, modo: "nao" } });
                else alterar({ grupo_id });
              }}
            />
            <CampoSelect
              rotulo="Status"
              valor={form.status}
              opcoes={STATUS_ITEM}
              onChange={(status) => alterar({ status })}
              disabled={form.repeticao.modo !== "nao" || listaDoFormulario}
            />
            <CampoSelect rotulo="Nível" valor={form.nivel} opcoes={NIVEIS_COM_NENHUM} onChange={(nivel) => alterar({ nivel })} />
            <CampoSelect
              rotulo="Urgência"
              valor={form.urgencia}
              opcoes={URGENCIAS_COM_NENHUM}
              onChange={(urgencia) => alterar({ urgencia })}
            />
            <Campo rotulo="Prazo">
              <input
                type="date"
                className={CAMPO}
                value={form.prazo}
                onChange={(e) => alterar({ prazo: e.target.value })}
              />
            </Campo>
          </div>

          <CampoRepetir
            valor={form.repeticao}
            sempreRepete={listaDoFormulario}
            onChange={(repeticao) => alterar({ repeticao })}
          />

          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 p-3">
            <div>
              <p className="text-sm font-medium">Fixado</p>
              <p className="text-xs text-white/50">Marca o item com o alfinete.</p>
            </div>
            <Toggle label="Fixado" checked={form.fixado} onChange={(v) => alterar({ fixado: v })} />
          </div>
        </fieldset>
      </div>

      <ConfirmDialog
        open={confirmandoExclusao}
        title="Excluir item?"
        description={`"${item.titulo}" será apagado de vez.`}
        confirmLabel="Excluir"
        danger
        loading={salvando}
        onConfirm={excluir}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </Drawer>
  );
}
