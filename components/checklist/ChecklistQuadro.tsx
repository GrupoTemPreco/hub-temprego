"use client";

import { useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { colunasNaTela, type FaixaTela } from "@/lib/checklistColunas";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { AcessoGrupo } from "@/lib/checklistAcesso";
import { usePonteiroToque } from "@/hooks/usePonteiroToque";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import type { FiltrosChecklist } from "@/lib/checklistRegras";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import type { AcoesChecklist } from "./useChecklistDados";
import { detectarColisao, idGrupo, useArrastoChecklist } from "./useArrastoChecklist";
import { GrupoBloco } from "./GrupoBloco";
import { ItemConteudo } from "./ItemLinha";

type Props = {
  grupos: ChecklistGrupo[];
  itens: ChecklistItem[];
  filtros: FiltrosChecklist;
  /** Preferência salva do usuário. A tela estreita reduz só na hora de desenhar. */
  colunas: number;
  acoes: AcoesChecklist;
  acessoDe: (grupoId: string) => AcessoGrupo;
  onAbrirItem: (item: ChecklistItem) => void;
};

const CONSULTA_CELULAR = "(max-width: 767px)";
const CONSULTA_TABLET = "(max-width: 1279px)";

function lerFaixa(): FaixaTela {
  if (window.matchMedia(CONSULTA_CELULAR).matches) return "celular";
  if (window.matchMedia(CONSULTA_TABLET).matches) return "tablet";
  return "desktop";
}

function inscreverFaixa(callback: () => void) {
  const celular = window.matchMedia(CONSULTA_CELULAR);
  const tablet = window.matchMedia(CONSULTA_TABLET);
  celular.addEventListener("change", callback);
  tablet.addEventListener("change", callback);
  return () => {
    celular.removeEventListener("change", callback);
    tablet.removeEventListener("change", callback);
  };
}

function useFaixaTela() {
  return useSyncExternalStore(inscreverFaixa, lerFaixa, () => "desktop" as const);
}

const chaveAvisoCompartilhado = (usuarioId: string) => `hub:aviso-grupo-compartilhado:${usuarioId}`;

/** Uma vez por usuário: na primeira vez que ele arrasta um item para um grupo compartilhado. */
function jaAvisouCompartilhado(usuarioId: string) {
  try {
    if (window.localStorage.getItem(chaveAvisoCompartilhado(usuarioId))) return true;
    window.localStorage.setItem(chaveAvisoCompartilhado(usuarioId), "1");
  } catch {
    // Sem localStorage, o aviso pode aparecer de novo em outra sessão.
  }
  return false;
}

export function ChecklistQuadro({ grupos, itens, filtros, colunas, acoes, acessoDe, onAbrirItem }: Props) {
  const toast = useToast();
  const faixa = useFaixaTela();
  const colunasVisiveis = colunasNaTela(colunas, faixa);
  const usuarioId = useUsuarioAtual().id;
  const isMobile = useIsMobile();
  const toque = usePonteiroToque();
  const pelaAlca = isMobile || toque;
  const sensores = useSensors(
    // A distância mínima deixa o clique (abrir item, checkbox, alfinete) funcionar sem iniciar arrasto.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { visao, itemAtivo, grupoAtivo, handlers } = useArrastoChecklist({
    grupos,
    itens,
    filtros,
    moverItem: (id, campos) => {
      if (campos.grupo_id && acessoDe(campos.grupo_id).compartilhado && !jaAvisouCompartilhado(usuarioId)) {
        toast.success("Os membros desta lista vão ver esta tarefa.");
      }
      void acoes.alterarItem(id, campos, "Não foi possível mover o item");
    },
    moverGrupo: (id, ordem) => void acoes.moverGrupo(id, ordem),
  });

  return (
    <DndContext sensors={sensores} collisionDetection={detectarColisao} {...handlers}>
      <SortableContext items={grupos.map((g) => idGrupo(g.id))} strategy={rectSortingStrategy}>
        <div
          className="grid items-start gap-4"
          style={{ gridTemplateColumns: `repeat(${colunasVisiveis}, minmax(0, 1fr))` }}
        >
          {grupos.map((grupo) => (
            <GrupoBloco
              key={grupo.id}
              grupo={grupo}
              acesso={acessoDe(grupo.id)}
              visao={visao.get(grupo.id)!}
              ordemManual={filtros.ordenacao === "manual"}
              pelaAlca={pelaAlca}
              acoes={acoes}
              onAbrirItem={onAbrirItem}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {itemAtivo && (
          <div className="rounded-lg border border-blue-500/40 bg-[#0f172a] shadow-2xl">
            <ItemConteudo item={itemAtivo} ocultarSeloDiaria={grupos.find((g) => g.id === itemAtivo.grupo_id)?.diaria} />
          </div>
        )}
        {grupoAtivo && (
          <div className="rounded-xl border border-white/15 bg-[#0f172a] shadow-2xl">
            <div className={`h-1.5 rounded-t-xl ${classeCorGrupo(grupoAtivo.cor)}`} />
            <p className="px-3 py-2 text-sm font-semibold text-white">{grupoAtivo.nome}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
