"use client";

import type { DestinoValor, SetorReferencia, UsuarioReferencia } from "@/lib/ticketsApi";

type Props = {
  value: DestinoValor | "";
  onChange: (valor: DestinoValor) => void;
  setores: SetorReferencia[];
  pessoas: UsuarioReferencia[];
  className?: string;
};

/** Select único com dois grupos: setores e pessoas. */
export function DestinoSelect({ value, onChange, setores, pessoas, className = "" }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as DestinoValor)} className={className}>
      <option value="" disabled>
        Selecione um setor ou uma pessoa...
      </option>
      {setores.length > 0 && (
        <optgroup label="Setores">
          {setores.map((s) => (
            <option key={s.id} value={`setor:${s.id}`}>
              {s.nome}
            </option>
          ))}
        </optgroup>
      )}
      {pessoas.length > 0 && (
        <optgroup label="Pessoas">
          {pessoas.map((u) => (
            <option key={u.id} value={`usuario:${u.id}`}>
              {u.nome || u.email}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
