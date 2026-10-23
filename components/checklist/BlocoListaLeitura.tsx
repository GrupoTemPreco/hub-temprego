"use client";

import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import { ItemConteudo } from "./ItemLinha";
import { ConcluidosSecao } from "./ConcluidosSecao";

const nada = () => {};

type Props = {
  lista: ChecklistGrupo;
  itens: ChecklistItem[];
  /** Sem cabeçalho quando quem usa já mostra a faixa e o nome (ex.: listas arquivadas). */
  cabecalho?: boolean;
};

/** Lista em leitura: mesmo visual do checklist, sem arrastar, sem checkbox e sem menus; concluídos recolhidos. */
export function BlocoListaLeitura({ lista, itens, cabecalho = true }: Props) {
  const pendentes = itens.filter((i) => i.status !== "feito").sort((a, b) => a.ordem - b.ordem);
  const concluidos = itens.filter((i) => i.status === "feito").sort((a, b) => a.ordem - b.ordem);

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      {cabecalho && (
        <>
          <div className={`h-1.5 rounded-t-xl ${classeCorGrupo(lista.cor)}`} />
          <header className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <h3 className="truncate text-sm font-semibold text-white">{lista.nome}</h3>
            <span title="Pendentes" className="shrink-0 rounded-full bg-white/10 px-1.5 text-xs font-medium text-white/70">
              {pendentes.length}
            </span>
          </header>
        </>
      )}
      <ul className="divide-y divide-white/5">
        {pendentes.map((item) => (
          <li key={item.id}>
            <ItemConteudo item={item} somenteLeitura />
          </li>
        ))}
        {pendentes.length === 0 && <li className="px-3 py-3 text-xs text-white/40">Nenhum item pendente.</li>}
      </ul>
      <ConcluidosSecao
        itens={concluidos}
        somenteLeitura
        autorDe={() => undefined}
        onAbrir={nada}
        onReabrir={nada}
        onAlternarFixado={nada}
      />
    </section>
  );
}
