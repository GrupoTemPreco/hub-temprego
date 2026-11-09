"use client";

import { origemDosCampos, type CamposOrigem } from "@/lib/checklistOrigem";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import { ItemConteudo } from "./ItemLinha";
import { DiariaChip } from "./ItemChips";
import { RecebidaDeLista } from "./RecebidaDe";
import { ConcluidosSecao } from "./ConcluidosSecao";
import { TopoLista, contagemLista, ignorarRecolher } from "./TopoLista";

const nada = () => {};

type Props = {
  lista: ChecklistGrupo & CamposOrigem;
  itens: ChecklistItem[];
  /** Sem cabeçalho quando quem usa já mostra a faixa e o nome (ex.: listas arquivadas). */
  cabecalho?: boolean;
  /** Recolhida: só a faixa. Quem chama guarda o estado (memória ou localStorage). */
  minimizada?: boolean;
  onAlternarMinimizada?: () => void;
  onAbrirItem?: (item: ChecklistItem) => void;
  destaqueId?: string | null;
};

/** Lista em leitura: mesmo visual do checklist, sem arrastar, sem checkbox e sem menus; concluídos recolhidos. */
export function BlocoListaLeitura({
  lista,
  itens,
  cabecalho = true,
  minimizada = false,
  onAlternarMinimizada,
  onAbrirItem,
  destaqueId = null,
}: Props) {
  const pendentes = itens.filter((i) => i.status !== "feito").sort((a, b) => a.ordem - b.ordem);
  const concluidos = itens.filter((i) => i.status === "feito").sort((a, b) => a.ordem - b.ordem);
  const abrir = onAbrirItem ?? nada;

  return (
    <section className="rounded-xl border border-borda bg-superficie">
      {cabecalho && (
        <>
          <div className={`h-1.5 rounded-t-xl ${classeCorGrupo(lista.cor)}`} />
          <TopoLista minimizada={minimizada} onAlternar={onAlternarMinimizada}>
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-texto">{lista.nome}</h3>
            <RecebidaDeLista origem={origemDosCampos(lista.recebida_de_nome, lista.recebida_em)} />
            {lista.diaria && (
              <span className="shrink-0" {...ignorarRecolher}>
                <DiariaChip dias={lista.dias_semana} />
              </span>
            )}
            {minimizada ? (
              <span className="shrink-0 text-xs text-texto-suave">{contagemLista(pendentes.length, concluidos.length)}</span>
            ) : (
              <span
                title="Pendentes"
                className="shrink-0 rounded-full bg-superficie-hover px-1.5 text-xs font-medium text-texto/70"
                {...ignorarRecolher}
              >
                {pendentes.length}
              </span>
            )}
          </TopoLista>
        </>
      )}
      {!minimizada && (
        <>
          <ul className="divide-y divide-borda">
            {pendentes.map((item) => (
              <li key={item.id} className={item.id === destaqueId ? "bg-blue-500/10" : undefined}>
                <ItemConteudo item={item} somenteLeitura repeticaoLista={lista} onAbrir={() => abrir(item)} />
              </li>
            ))}
            {pendentes.length === 0 && <li className="px-3 py-3 text-xs text-texto/40">Nenhum item pendente.</li>}
          </ul>
          <ConcluidosSecao
            itens={concluidos}
            somenteLeitura
            autorDe={() => undefined}
            onAbrir={abrir}
            onReabrir={nada}
            onAlternarFixado={nada}
            repeticaoLista={lista}
            destaqueId={destaqueId}
          />
        </>
      )}
    </section>
  );
}
