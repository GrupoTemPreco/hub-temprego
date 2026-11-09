"use client";

import { AlertTriangle, Inbox, PauseCircle, Send, UserCheck, UserX, X } from "lucide-react";
import { CHIP } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET, STATUS_TICKET } from "@/lib/tickets";
import type { AtalhoTicket, ContagemAtalhos, FiltrosTickets } from "@/lib/admin/ticketsConsulta";
import type { Referencias } from "@/lib/ticketsApi";
import type { AlteracaoUrl } from "./useTicketsUrl";

const ATALHOS: Array<{ id: AtalhoTicket; label: string; icon: typeof AlertTriangle }> = [
  { id: "atrasados", label: "Atrasados", icon: AlertTriangle },
  { id: "parados", label: "Parados há +5 dias", icon: PauseCircle },
  { id: "comigo", label: "Comigo", icon: Inbox },
  { id: "meus", label: "Atribuídos a mim", icon: UserCheck },
  { id: "abertos-por-mim", label: "Abertos por mim", icon: Send },
  { id: "sem-responsavel", label: "Sem responsável", icon: UserX },
];

const SELECT = "rounded-md border border-borda px-2.5 py-1.5 text-sm outline-none focus:border-blue-500";

type Props = {
  filtros: FiltrosTickets;
  referencias: Referencias | null;
  contagem: ContagemAtalhos | null;
  alterar: (mudancas: AlteracaoUrl) => void;
  onLimpar: () => void;
};

export function TicketsFiltros({ filtros, referencias, contagem, alterar, onLimpar }: Props) {
  const aprovados = (referencias?.usuarios ?? []).filter((u) => u.status === "aprovado");
  const temFiltro = Object.entries(filtros).some(([chave, valor]) => chave !== "encerrados" && Boolean(valor));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Status" className={SELECT} value={filtros.status} onChange={(e) => alterar({ status: e.target.value })}>
          <option value="">Status: todos</option>
          {STATUS_TICKET.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select aria-label="Categoria" className={SELECT} value={filtros.categoria} onChange={(e) => alterar({ categoria: e.target.value })}>
          <option value="">Categoria: todas</option>
          {CATEGORIAS_TICKET.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select aria-label="Prioridade" className={SELECT} value={filtros.prioridade} onChange={(e) => alterar({ prioridade: e.target.value })}>
          <option value="">Prioridade: todas</option>
          {PRIORIDADES_TICKET.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select aria-label="Setor de destino" className={SELECT} value={filtros.setor} onChange={(e) => alterar({ setor: e.target.value })}>
          <option value="">Setor: todos</option>
          {(referencias?.setores ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <select aria-label="Pessoa de destino" className={SELECT} value={filtros.pessoa} onChange={(e) => alterar({ pessoa: e.target.value })}>
          <option value="">Pessoa: todas</option>
          {aprovados.map((u) => (
            <option key={u.id} value={u.id}>{u.nome || u.email}</option>
          ))}
        </select>
        <select aria-label="Responsável" className={SELECT} value={filtros.responsavel} onChange={(e) => alterar({ responsavel: e.target.value })}>
          <option value="">Responsável: todos</option>
          {aprovados.map((u) => (
            <option key={u.id} value={u.id}>{u.nome || u.email}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-texto/60">
          Criados de
          <input type="date" className={SELECT} value={filtros.de} onChange={(e) => alterar({ de: e.target.value })} />
          até
          <input type="date" className={SELECT} value={filtros.ate} onChange={(e) => alterar({ ate: e.target.value })} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ATALHOS.map(({ id, label, icon: Icon }) => {
          const ativo = filtros.filtro === id;
          return (
            <button
              key={id}
              onClick={() => alterar({ filtro: ativo ? null : id })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                ativo ? CHIP.info : "border-borda bg-superficie text-texto/65 hover:bg-superficie-hover hover:text-texto"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {contagem && <span className="rounded-full bg-superficie-hover px-1.5">{contagem[id]}</span>}
            </button>
          );
        })}

        <label className="ml-auto flex items-center gap-2 text-sm text-texto/65">
          <Toggle label="Mostrar encerrados" checked={filtros.encerrados} onChange={(v) => alterar({ encerrados: v })} />
          Mostrar encerrados
        </label>
        {temFiltro && (
          <button onClick={onLimpar} className="inline-flex items-center gap-1 text-xs text-texto-suave hover:text-texto">
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
