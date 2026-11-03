"use client";

import { useEffect, useState } from "react";
import { COLUNAS_MAX, COLUNAS_MIN } from "@/lib/checklistColunas";

const CAMPO = "rounded-md border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500";
const PREDEFINIDAS = [3, 4, 5] as const;

function ehPredefinida(n: number): n is (typeof PREDEFINIDAS)[number] {
  return PREDEFINIDAS.some((p) => p === n);
}

type Props = {
  valor: number;
  onChange: (colunas: number) => void;
};

/** 3, 4, 5 ou um número livre de 1 a 8. O valor salvo continua sendo só o número. */
export function SeletorColunas({ valor, onChange }: Props) {
  const [personalizado, setPersonalizado] = useState(!ehPredefinida(valor));
  const [rascunho, setRascunho] = useState(String(valor));

  useEffect(() => {
    if (!ehPredefinida(valor)) setPersonalizado(true);
  }, [valor]);

  useEffect(() => setRascunho(String(valor)), [valor]);

  const modo = personalizado || !ehPredefinida(valor) ? "personalizado" : String(valor);

  function escolher(opcao: string) {
    if (opcao === "personalizado") {
      setPersonalizado(true);
      return;
    }
    setPersonalizado(false);
    onChange(Number(opcao));
  }

  function digitar(texto: string) {
    setRascunho(texto);
    const n = Number(texto);
    if (texto !== "" && Number.isInteger(n) && n >= COLUNAS_MIN && n <= COLUNAS_MAX) onChange(n);
  }

  return (
    <div className="flex items-center gap-1.5">
      <select aria-label="Colunas da grade" className={CAMPO} value={modo} onChange={(e) => escolher(e.target.value)}>
        <option value="3">Colunas: 3</option>
        <option value="4">Colunas: 4</option>
        <option value="5">Colunas: 5</option>
        <option value="personalizado">Personalizado</option>
      </select>
      {modo === "personalizado" && (
        <input
          type="number"
          min={COLUNAS_MIN}
          max={COLUNAS_MAX}
          inputMode="numeric"
          aria-label="Número de colunas"
          className={`${CAMPO} w-16`}
          value={rascunho}
          onChange={(e) => digitar(e.target.value)}
          onBlur={() => setRascunho(String(valor))}
        />
      )}
    </div>
  );
}
