"use client";

import { Search } from "lucide-react";
import type { Setor } from "@/lib/types/shell";

export type FiltroStatus = "todos" | "pendente" | "aprovado" | "rejeitado";

export type FiltrosUsuarios = {
  busca: string;
  status: FiltroStatus;
  setorId: string;
};

export const OPCOES_STATUS: Array<{ value: FiltroStatus; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "rejeitado", label: "Rejeitado" },
];

export function parseFiltroStatus(valor: string | null): FiltroStatus {
  return OPCOES_STATUS.some((o) => o.value === valor) ? (valor as FiltroStatus) : "todos";
}

type Props = {
  filtros: FiltrosUsuarios;
  setores: Setor[];
  onChange: (filtros: FiltrosUsuarios) => void;
};

const SELECT = "rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

export function UsuariosFiltros({ filtros, setores, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-60 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full rounded-md border border-white/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </label>

      <select
        aria-label="Filtrar por status"
        value={filtros.status}
        onChange={(e) => onChange({ ...filtros, status: e.target.value as FiltroStatus })}
        className={SELECT}
      >
        {OPCOES_STATUS.map((o) => (
          <option key={o.value} value={o.value}>
            Status: {o.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por setor"
        value={filtros.setorId}
        onChange={(e) => onChange({ ...filtros, setorId: e.target.value })}
        className={SELECT}
      >
        <option value="">Setor: Todos</option>
        {setores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome}
            {s.ativo ? "" : " (inativo)"}
          </option>
        ))}
      </select>
    </div>
  );
}
