"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { TextoCortado } from "@/components/ui/Tooltip";
import type { ChecklistItem } from "@/lib/types/shell";
import { mostraSeloProprio, situacaoRecorrencia, temDiasEspecificos, textoProxima, type RepeticaoLista } from "@/lib/checklistDiarias";
import { AtrasadaChip, EmAndamentoChip, DiariaChip, NivelChip, PrazoChip, ProximaTexto, UrgenciaChip } from "./ItemChips";
import { idItem } from "./useArrastoChecklist";
import { useAcoesEnvioItem } from "./envios/AcoesEnvioItem";
import { ItemEnvioChip } from "./envios/ItemEnvioChip";
import { ItemMenu } from "./envios/ItemMenu";

export type AcoesLinha = {
  onAbrir?: () => void;
  onAlternarFeito?: () => void;
  onAlternarFixado?: () => void;
};

type ConteudoProps = AcoesLinha & {
  item: ChecklistItem;
  alca?: ReactNode;
  acaoExtra?: ReactNode;
  /** Grupo compartilhado só para leitura: sem checkbox, alfinete e menu. */
  somenteLeitura?: boolean;
  /** Em grupos compartilhados: nome de quem criou o item (vira as iniciais). */
  autor?: string;
  /** Repetição da lista: ela já mostra o selo, e a tarefa com os mesmos dias não repete. */
  repeticaoLista?: RepeticaoLista | null;
};

export function ItemConteudo({
  item,
  onAbrir,
  onAlternarFeito,
  onAlternarFixado,
  alca,
  acaoExtra,
  somenteLeitura = false,
  autor,
  repeticaoLista = null,
}: ConteudoProps) {
  const feito = item.status === "feito";
  const envios = useAcoesEnvioItem();
  const situacao = envios?.situacao(item) ?? null;
  // Enquanto aguarda resposta, o item só pode ser arrastado e aberto para leitura.
  const aguardando = situacao?.tipo === "aguardando";
  const travado = aguardando || somenteLeitura;
  const recorrencia = situacaoRecorrencia(item);
  const semOcorrencia = recorrencia?.tipo === "sem_ocorrencia";
  const diasEspecificos = temDiasEspecificos(item);
  const mostrarSelo = mostraSeloProprio(item, repeticaoLista);
  const proxima = recorrencia && recorrencia.tipo !== "pendente" && diasEspecificos ? recorrencia.proxima : null;
  return (
    <div
      onClick={onAbrir}
      className="group flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors hover:bg-superficie"
    >
      {alca}
      {!somenteLeitura && (
        <input
          type="checkbox"
          checked={feito && !semOcorrencia}
          disabled={aguardando || semOcorrencia}
          title={
            aguardando ? "Aguardando resposta do envio" : semOcorrencia && proxima ? textoProxima(proxima) : undefined
          }
          aria-label={feito ? `Reabrir "${item.titulo}"` : `Concluir "${item.titulo}"`}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onAlternarFeito?.()}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        />
      )}
      {autor && <Avatar nome={autor} size="xs" title={`Criado por ${autor}`} />}
      <div className={`min-w-0 flex-1 ${aguardando ? "opacity-55" : ""}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <TextoCortado className={`min-w-0 max-w-full truncate text-sm ${feito ? "text-texto/45 line-through" : "text-texto/90"}`}>
            {item.titulo}
          </TextoCortado>
          <NivelChip nivel={item.nivel} />
          <UrgenciaChip urgencia={item.urgencia} />
          {mostrarSelo && <DiariaChip dias={item.dias_semana} />}
          {recorrencia?.tipo === "pendente" && recorrencia.atrasada && <AtrasadaChip ocorrencia={recorrencia.ocorrencia} />}
          {item.prazo && <PrazoChip prazo={item.prazo} feito={feito} />}
          {item.status === "em_andamento" && <EmAndamentoChip />}
          {situacao && <ItemEnvioChip situacao={situacao} />}
          {proxima && <ProximaTexto data={proxima} />}
        </div>
        {item.observacao && <p className="mt-0.5 truncate text-xs text-texto/45">{item.observacao}</p>}
      </div>
      {acaoExtra}
      {somenteLeitura ? (
        item.fixado && <Pin aria-label="Fixado" className="m-1 h-3.5 w-3.5 shrink-0 fill-current text-amber-300/70" />
      ) : (
        <button
          type="button"
          disabled={travado}
          aria-label={item.fixado ? "Desafixar item" : "Fixar item"}
          aria-pressed={item.fixado}
          title={item.fixado ? "Desafixar" : "Fixar"}
          onClick={(e) => {
            e.stopPropagation();
            onAlternarFixado?.();
          }}
          className={`shrink-0 rounded p-1 transition-colors hover:bg-superficie-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
            item.fixado ? "text-amber-300" : "text-texto/30 hover:text-texto/70"
          }`}
        >
          <Pin className={`h-3.5 w-3.5 ${item.fixado ? "fill-current" : ""}`} />
        </button>
      )}
      {!feito && !somenteLeitura && <ItemMenu item={item} situacao={situacao} />}
    </div>
  );
}

type ArrastavelProps = AcoesLinha & {
  item: ChecklistItem;
  /** Em telas de toque o arrasto começa só pela alça, para não brigar com a rolagem. */
  pelaAlca: boolean;
  /** Falso em grupo compartilhado só para leitura: sem arrasto e sem ações. */
  editavel: boolean;
  autor?: string;
  repeticaoLista?: RepeticaoLista | null;
};

export function ItemArrastavel({ item, pelaAlca, editavel, autor, repeticaoLista, ...acoes }: ArrastavelProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: idItem(item.id),
    data: { grupoId: item.grupo_id, editavel },
    disabled: !editavel,
  });

  const alca = pelaAlca && editavel ? (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Arrastar item"
      onClick={(e) => e.stopPropagation()}
      className="-ml-1.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-texto/40 hover:text-texto/80"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  ) : undefined;

  return (
    <li
      ref={(no) => {
        setNodeRef(no);
        // Sem activator, Enter/Espaço em qualquer botão da linha iniciaria o arrasto pelo teclado.
        if (!pelaAlca) setActivatorNodeRef(no);
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...(pelaAlca || !editavel ? {} : { ...attributes, ...listeners })}
    >
      <ItemConteudo
        item={item}
        alca={alca}
        somenteLeitura={!editavel}
        autor={autor}
        repeticaoLista={repeticaoLista}
        {...acoes}
      />
    </li>
  );
}
