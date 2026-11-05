"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, type SortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import type { AcessoGrupo } from "@/lib/checklistAcesso";
import { camposDaLista } from "@/lib/checklistDiarias";
import type { VisaoGrupo } from "@/lib/checklistRegras";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import type { AcoesChecklist } from "./useChecklistDados";
import { idGrupo, idItem, idLista } from "./useArrastoChecklist";
import { ItemArrastavel } from "./ItemLinha";
import { DiariaChip } from "./ItemChips";
import { RecebidaDeLista } from "./RecebidaDe";
import { AdicionarRapido } from "./AdicionarRapido";
import { ConcluidosSecao } from "./ConcluidosSecao";
import { GrupoMenu, type EnvioDaLista } from "./GrupoMenu";
import { useChecklistEnvios } from "./envios/ChecklistEnviosProvider";
import { ListaEnvioChip } from "./envios/ItemEnvioChip";
import { EnviarListaModal } from "./envios/EnviarListaModal";
import { ListaProgressoModal } from "./envios/ListaProgressoModal";
import { destinoDoLote } from "./envios/textosLote";
import { AvataresMembros } from "./membros/AvataresMembros";
import { CompartilharGrupoModal } from "./membros/CompartilharGrupoModal";
import { TopoLista, contagemLista, ignorarRecolher } from "./TopoLista";

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
  minimizada: boolean;
  onAlternarMinimizada: () => void;
  /** Alguma tarefa da lista (sem filtros) aguarda resposta de um envio: a lista não pode ser enviada. */
  tarefaComEnvioPendente: boolean;
};

export function GrupoBloco({
  grupo,
  acesso,
  visao,
  ordemManual,
  pelaAlca,
  acoes,
  onAbrirItem,
  minimizada,
  onAlternarMinimizada,
  tarefaComEnvioPendente,
}: Props) {
  const { nomeDe, nomeSetor, listas, origemDaLista } = useChecklistEnvios();
  const origemLista = origemDaLista(grupo.id);
  const [compartilhando, setCompartilhando] = useState(false);
  const [enviandoLista, setEnviandoLista] = useState(false);
  const [progressoAberto, setProgressoAberto] = useState(false);
  const situacaoEnvio = acesso.dono ? listas.situacaoDaLista(grupo.id) : null;
  const todos = situacaoEnvio?.tipo === "todos";
  const lotePendente =
    situacaoEnvio &&
    (situacaoEnvio.tipo === "aguardando" || (situacaoEnvio.tipo === "todos" && situacaoEnvio.lote.pendentes.length > 0))
      ? situacaoEnvio.lote
      : null;
  const travada = situacaoEnvio?.tipo === "aguardando" ? situacaoEnvio.lote : null;
  const envioDaLista: EnvioDaLista = {
    aguardando: lotePendente
      ? { destino: destinoDoLote(lotePendente, { nomeDe, nomeSetor }), ultimoEnvioEm: lotePendente.ultimoEnvioEm }
      : null,
    todos: Boolean(todos),
    bloqueio: tarefaComEnvioPendente ? "Alguma tarefa desta lista tem um envio pendente" : null,
    onEnviar: () => setEnviandoLista(true),
    onReenviar: () => (lotePendente ? listas.reenviar(lotePendente) : Promise.resolve(false)),
    onCancelar: () => (lotePendente ? listas.cancelar(lotePendente) : Promise.resolve(false)),
  };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: idGrupo(grupo.id),
  });
  const { setNodeRef: setListaRef } = useDroppable({
    id: idLista(grupo.id),
    data: { grupoId: grupo.id, editavel: acesso.podeEditar },
    disabled: !acesso.podeEditar,
  });
  // Minimizada, a faixa inteira é a área de soltar (a lista some). O efeito roda depois
  // do ref da <ul>, para os dois não se apagarem no mesmo commit.
  const secaoRef = useRef<HTMLElement | null>(null);
  const refSecao = useCallback(
    (node: HTMLElement | null) => {
      secaoRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );
  useLayoutEffect(() => {
    if (minimizada) setListaRef(secaoRef.current);
  }, [minimizada, setListaRef]);
  // Avatares: para o dono, os membros; para o membro, o dono e os outros membros.
  const pessoas = acesso.dono ? acesso.membros.map((m) => m.usuario_id) : [acesso.donoId, ...acesso.membros.map((m) => m.usuario_id)];
  const autorDe = (item: ChecklistItem) => (acesso.compartilhado && item.criado_por ? nomeDe(item.criado_por) : undefined);

  const alternarFeito = (item: ChecklistItem) =>
    item.diaria
      ? acoes.alternarDiaria(item.id, item.status !== "feito")
      : acoes.alterarItem(item.id, { status: item.status === "feito" ? "a_fazer" : "feito" });
  const alternarFixado = (item: ChecklistItem) => acoes.alterarItem(item.id, { fixado: !item.fixado });

  return (
    <section
      ref={refSecao}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-xl border border-white/10 bg-white/3 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className={`h-1.5 rounded-t-xl ${travada ? "bg-white/20" : classeCorGrupo(grupo.cor)}`} />
      <TopoLista className="gap-2" minimizada={minimizada} onAlternar={onAlternarMinimizada}>
        {pelaAlca && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label="Arrastar lista"
            className="-ml-1 shrink-0 touch-none rounded p-0.5 text-white/40 hover:text-white/80"
            {...ignorarRecolher}
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
          <h2 className={`min-w-0 truncate text-sm font-semibold ${travada ? "text-white/50" : "text-white"}`}>{grupo.nome}</h2>
          {origemLista && (
            <span className="min-w-0" {...ignorarRecolher}>
              <RecebidaDeLista origem={origemLista} />
            </span>
          )}
          {grupo.diaria && (
            <span className="shrink-0" {...ignorarRecolher}>
              <DiariaChip dias={grupo.dias_semana} />
            </span>
          )}
          {situacaoEnvio && (
            <span className="shrink-0" {...ignorarRecolher}>
              <ListaEnvioChip
                situacao={situacaoEnvio}
                onAbrirProgresso={todos ? () => setProgressoAberto(true) : undefined}
              />
            </span>
          )}
          {minimizada ? (
            <span className="shrink-0 text-xs text-white/55">{contagemLista(visao.totalPendentes, visao.totalFeitos)}</span>
          ) : (
            <span
              title="Pendentes"
              className="shrink-0 rounded-full bg-white/10 px-1.5 text-xs font-medium text-white/70"
              {...ignorarRecolher}
            >
              {visao.totalPendentes}
            </span>
          )}
          {!acesso.dono && (
            <span
              className="shrink-0 truncate rounded-full border border-white/10 px-1.5 text-[11px] text-white/55"
              {...ignorarRecolher}
            >
              de {nomeDe(acesso.donoId).split(/\s+/)[0]}
              {!acesso.podeEditar && " · só leitura"}
            </span>
          )}
        </div>
        {pessoas.length > 0 && (
          <span {...ignorarRecolher}>
            <AvataresMembros usuarioIds={pessoas} />
          </span>
        )}
        <GrupoMenu
          grupo={grupo}
          dono={acesso.dono}
          onRenomear={(nome) => acoes.alterarGrupo(grupo.id, { nome }, "Não foi possível renomear a lista")}
          onCor={(cor) => void acoes.alterarGrupo(grupo.id, { cor }, "Não foi possível mudar a cor")}
          compartilhada={acesso.compartilhado}
          onArquivar={() => acoes.arquivarGrupo(grupo.id)}
          onCompartilhar={() => setCompartilhando(true)}
          onSair={() => acoes.sairDoGrupo(grupo.id)}
          onRepetir={(nova) => acoes.definirRepeticaoLista(grupo.id, nova)}
          qtdConcluidasAntesDeHoje={acoes.contarConcluidasAntesDeHoje(grupo.id)}
          envio={envioDaLista}
        />
      </TopoLista>

      {!minimizada && (
        <div className={travada ? "opacity-50 grayscale" : undefined}>
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
                  repeticaoLista={grupo}
                />
              ))}
              {visao.pendentes.length === 0 && <li className="px-3 py-3 text-xs text-white/40">Nenhum item pendente.</li>}
            </ul>
          </SortableContext>

          {acesso.podeEditar && (
            <AdicionarRapido
              onAdicionar={(titulo) =>
                acoes.adicionarItem(grupo.id, { titulo, ...(grupo.diaria ? camposDaLista(grupo) : {}) }).then(Boolean)
              }
            />
          )}

          <ConcluidosSecao
            itens={visao.concluidos}
            somenteLeitura={!acesso.podeEditar}
            autorDe={autorDe}
            onAbrir={onAbrirItem}
            onReabrir={(item) =>
              void (item.diaria ? acoes.alternarDiaria(item.id, false) : acoes.alterarItem(item.id, { status: "a_fazer" }))
            }
            onAlternarFixado={(item) => void alternarFixado(item)}
            repeticaoLista={grupo}
          />
        </div>
      )}

      {progressoAberto && situacaoEnvio?.tipo === "todos" && (
        <ListaProgressoModal lote={situacaoEnvio.lote} onClose={() => setProgressoAberto(false)} />
      )}

      {enviandoLista && (
        <EnviarListaModal
          grupo={grupo}
          qtdTarefas={visao.totalPendentes + visao.totalFeitos}
          compartilhada={acesso.compartilhado}
          onClose={() => setEnviandoLista(false)}
        />
      )}

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
