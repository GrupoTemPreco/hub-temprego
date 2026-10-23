import { Children, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Com dois cards, a partir de que largura eles ficam lado a lado. */
  ladoALadoEm?: "md" | "lg";
};

const COLUNAS_DOIS = { md: "md:grid-cols-2", lg: "lg:grid-cols-2" };

/**
 * Cards de uma linha dividindo a largura toda, com a mesma altura. Filhos nulos não ocupam lugar,
 * e com três cards no tablet (2 colunas) o terceiro ocupa a linha inteira para não sobrar espaço.
 */
export function LinhaCards({ children, ladoALadoEm = "md" }: Props) {
  const cards = Children.toArray(children);
  const colunas = cards.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : cards.length === 2 ? COLUNAS_DOIS[ladoALadoEm] : "";

  return (
    <div className={`grid gap-6 ${colunas}`}>
      {cards.map((card, i) => (
        <div key={i} className={`min-w-0 ${cards.length === 3 && i === 2 ? "md:col-span-2 lg:col-span-1" : ""}`}>
          {card}
        </div>
      ))}
    </div>
  );
}
