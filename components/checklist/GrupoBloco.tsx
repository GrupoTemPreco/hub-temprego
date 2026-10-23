"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, type SortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import type { AcessoGrupo } from "@/lib/checklistAcesso";
import type { VisaoGrupo } from "@/lib/checklistRegras";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import type { AcoesChecklist } from "./useChecklistDados";
import { idGrupo, idItem, idLista } from "./useArrastoChecklist";
import { ItemArrastavel } from "./ItemLinha";
import { AdicionarRapido } from "./AdicionarRapido";
import { ConcluidosSecao } from "./ConcluidosSecao";
import { GrupoMenu } from "./GrupoMenu";
import { useChecklistEnvios } from "./envios/ChecklistEnviosProvider";
import { AvataresMembros } from "./membros/AvataresMembros";
import { CompartilharGrupoModal } from "./membros/CompartilharGrupoModal";

/** Fora da ordenação manual os itens não se reposicionam dentro do grupo. */
const semReordenar: SortingStrategy = () => null;

type Props = {
  grupo: ChecklistGrupo;
  acesso: AcessoGrupo;
  visao: VisaoGrupo;
  ordemManual: boolean;
  pelaAlca: boolean;
  acoes: AcoesChecklist;
  onAbrirItem: (item: ChecklistItem) => void;
};

export function GrupoBloco({ grupo, acesso, visao, ordemManual, pelaAlca, acoes, onAbrirItem }: Props) {
  const { nomeDe } = useChecklistEnvios();
  const [compartilhando, setCompartilhando] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: idGrupo(grupo.id),
  });
  const { setNodeRef: setListaRef } = useDroppable({
    id: idLista(grupo.id),
    data: { grupoId: grupo.id, editavel: acesso.podeEditar },
    disabled: !acesso.podeEditar,
  });
  // Avatares: para o dono, os membros; para o membro, o dono e os outros membros.
  const pessoas = acesso.dono ? acesso.membros.map((m) => m.usuario_id) : [acesso.donoId, ...acesso.membros.map((m) => m.usuario_id)];
  const autorDe = (item: ChecklistItem) => (acesso.compartilhado && item.criado_por ? nomeDe(item.criado_por) : undefined);

  const alternarFeito = (item: ChecklistItem) =>
    acoes.alterarItem(item.id, { status: item.status === "feito" ? "a_fazer" : "feito" });
  const alternarFixado = (item: ChecklistItem) => acoes.alterarItem(item.id, { fixado: !item.fixado });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-xl border border-white/10 bg-white/3 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className={`h-1.5 rounded-t-xl ${classeCorGrupo(grupo.cor)}`} />
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        {pelaAlca && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label="Arrastar lista"
            className="-ml-1 shrink-0 touch-none rounded p-0.5 text-white/40 hover:text-white/80"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div
          ref={pelaAlca ? undefined : setActivatorNodeRef}
          {...(pelaAlca ? {} : { ...attributes, ...listeners })}
          className={`flex min-w-0 flex-1 items-center gap-1.5 ${pelaAlca ? "" : "cursor-grab"}`}
        >
          <h2 className="truncate text-sm font-semibold text-white">{grupo.nome}</h2>
          <span title="Pendentes" className="shrink-0 rounded-full bg-white/10 px-1.5 text-xs font-medium text-white/70">
            {visao.totalPendentes}
          </span>
          {!acesso.dono && (
            <span className="shrink-0 truncate rounded-full border border-white/10 px-1.5 text-[11px] text-white/55">
              de {nomeDe(acesso.donoId).split(/\s+/)[0]}
              {!acesso.podeEditar && " · só leitura"}
            </span>
          )}
        </div>
        <AvataresMembros usuarioIds={pessoas} />
        <GrupoMenu
          grupo={grupo}
          dono={acesso.dono}
          onRenomear={(nome) => acoes.alterarGrupo(grupo.id, { nome }, "Não foi possível renomear a lista")}
          onCor={(cor) => void acoes.alterarGrupo(grupo.id, { cor }, "Não foi possível mudar a cor")}
          compartilhada={acesso.compartilhado}
          onArquivar={() => acoes.arquivarGrupo(grupo.id)}
          onCompartilhar={() => setCompartilhando(true)}
          onSair={() => acoes.sairDoGrupo(grupo.id)}
        />
      </header>

      <SortableContext
        items={visao.pendentes.map((i) => idItem(i.id))}
        strategy={ordemManual ? verticalListSortingStrategy : semReordenar}
      >
        <ul ref={setListaRef} className="min-h-10 divide-y divide-white/5">
          {visao.pendentes.map((item) => (
            <ItemArrastavel
              key={item.id}
              item={item}
              pelaAlca={pelaAlca}
              editavel={acesso.podeEditar}
              autor={autorDe(item)}
              onAbrir={() => onAbrirItem(item)}
              onAlternarFeito={() => void alternarFeito(item)}
              onAlternarFixado={() => void alternarFixado(item)}
            />
          ))}
          {visao.pendentes.length === 0 && <li className="px-3 py-3 text-xs text-white/40">Nenhum item pendente.</li>}
        </ul>
      </SortableContext>

      {acesso.podeEditar && (
        <AdicionarRapido onAdicionar={(titulo) => acoes.adicionarItem(grupo.id, { titulo }).then(Boolean)} />
      )}

      <ConcluidosSecao
        itens={visao.concluidos}
        somenteLeitura={!acesso.podeEditar}
        autorDe={autorDe}
        onAbrir={onAbrirItem}
        onReabrir={(item) => void acoes.alterarItem(item.id, { status: "a_fazer" })}
        onAlternarFixado={(item) => void alternarFixado(item)}
      />

      {compartilhando && (
        <CompartilharGrupoModal
          grupo={grupo}
          membros={acesso.membros}
          acoes={acoes}
          onClose={() => setCompartilhando(false)}
        />
      )}
    </section>
  );
}
