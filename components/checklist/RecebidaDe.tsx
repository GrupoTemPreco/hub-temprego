import { textoRecebidaLista, textoRecebidaTarefa, type OrigemRecebida } from "@/lib/checklistOrigem";

/** Na faixa da lista: "Recebida de Ana · 05/11". */
export function RecebidaDeLista({ origem }: { origem: OrigemRecebida | null | undefined }) {
  if (!origem) return null;
  return <span className="shrink-0 text-[11px] font-normal text-texto/40">{textoRecebidaLista(origem)}</span>;
}

/** No drawer da tarefa e no detalhe do RH: "Recebida de Ana em 05/11/2026". */
export function RecebidaDeTarefa({ origem }: { origem: OrigemRecebida | null | undefined }) {
  if (!origem) return null;
  return <p className="text-xs text-texto/45">{textoRecebidaTarefa(origem)}</p>;
}
