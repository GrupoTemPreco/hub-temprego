import type { ReactNode } from "react";

export const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/70">{rotulo}</span>
      {children}
    </label>
  );
}

type CampoSelectProps<T extends string | number> = {
  rotulo: string;
  valor: T;
  opcoes: Array<{ value: T; label: string }>;
  onChange: (valor: T) => void;
};

/** Select que devolve o valor no tipo original (número continua número). */
export function CampoSelect<T extends string | number>({ rotulo, valor, opcoes, onChange }: CampoSelectProps<T>) {
  return (
    <Campo rotulo={rotulo}>
      <select
        className={CAMPO}
        value={valor}
        onChange={(e) => {
          const escolhida = opcoes.find((o) => String(o.value) === e.target.value);
          if (escolhida) onChange(escolhida.value);
        }}
      >
        {opcoes.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Campo>
  );
}
