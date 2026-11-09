"use client";

import type { ComponentType } from "react";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
};

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  variant?: "pill" | "underline";
};

const ESTILOS = {
  pill: {
    lista: "flex flex-wrap gap-1 rounded-lg border border-borda bg-superficie p-1",
    base: "rounded-md px-3 py-1.5",
    ativo: "bg-blue-600 text-white shadow",
    inativo: "text-texto/60 hover:bg-superficie-hover hover:text-texto",
  },
  underline: {
    lista: "flex gap-1 overflow-x-auto border-b border-borda",
    base: "-mb-px border-b-2 px-3 py-2",
    ativo: "border-blue-500 text-texto",
    inativo: "border-transparent text-texto-suave hover:text-texto",
  },
};

export function Tabs<T extends string>({ items, value, onChange, variant = "pill" }: TabsProps<T>) {
  const estilo = ESTILOS[variant];

  return (
    <div role="tablist" className={estilo.lista}>
      {items.map(({ id, label, icon: Icon, count }) => {
        const ativo = id === value;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(id)}
            className={`flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors ${estilo.base} ${
              ativo ? estilo.ativo : estilo.inativo
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-superficie-hover px-1.5 text-xs">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
