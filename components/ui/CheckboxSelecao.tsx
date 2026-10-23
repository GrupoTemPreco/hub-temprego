"use client";

import { useEffect, useRef } from "react";

type Props = {
  checked: boolean;
  indeterminado?: boolean;
  onChange: () => void;
  rotulo: string;
};

/** Checkbox das tabelas com seleção; não deixa o clique abrir a linha. */
export function CheckboxSelecao({ checked, indeterminado = false, onChange, rotulo }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminado;
  }, [indeterminado]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      aria-label={rotulo}
      onClick={(e) => e.stopPropagation()}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer accent-blue-500"
    />
  );
}
