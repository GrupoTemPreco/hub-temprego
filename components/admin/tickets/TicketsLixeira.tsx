"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CheckboxSelecao } from "@/components/ui/CheckboxSelecao";
import type { Selecao } from "@/hooks/useSelecao";
import { useToast } from "@/components/ui/Toast";
import { formatarData, tempoRelativo } from "@/lib/format";
import { excluirTicketDefinitivamente, restaurarTicket } from "@/lib/admin/ticketsAcoes";
import type { ResolvedorNomes } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";

type Props = {
  tickets: Ticket[];
  nomes: ResolvedorNomes;
  selecao: Selecao;
  onAbrir: (ticket: Ticket) => void;
  onAlterado: () => void;
};

export function TicketsLixeira({ tickets, nomes, selecao, onAbrir, onAlterado }: Props) {
  const toast = useToast();
  const [apagando, setApagando] = useState<Ticket | null>(null);
  const [emAndamentoId, setEmAndamentoId] = useState<string | null>(null);

  async function executar(ticket: Ticket, acao: () => Promise<void>, sucesso: string) {
    setEmAndamentoId(ticket.id);
    try {
      await acao();
      toast.success(sucesso);
      onAlterado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setEmAndamentoId(null);
      setApagando(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="w-10 py-3 pl-4">
              <CheckboxSelecao
                checked={selecao.todosVisiveis}
                indeterminado={selecao.algunsVisiveis}
                onChange={selecao.alternarTodosVisiveis}
                rotulo="Selecionar todos os tickets da lixeira visíveis"
              />
            </th>
            <th className="px-3 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Título</th>
            <th className="px-3 py-3 font-medium">Excluído por</th>
            <th className="px-3 py-3 font-medium">Excluído em</th>
            <th className="px-3 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} onClick={() => onAbrir(t)} className="cursor-pointer border-b border-white/5 hover:bg-white/4">
              <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                <CheckboxSelecao
                  checked={selecao.estaSelecionado(t.id)}
                  onChange={() => selecao.alternar(t.id)}
                  rotulo={`Selecionar ticket #${t.numero}`}
                />
              </td>
              <td className="px-3 py-3 font-mono text-white/55">#{t.numero}</td>
              <td className="max-w-80 truncate px-3 py-3 font-medium">{t.titulo}</td>
              <td className="px-3 py-3 text-white/70">{nomes.usuario(t.excluido_por)}</td>
              <td className="px-3 py-3 text-white/60">
                {formatarData(t.excluido_em)}
                <span className="ml-1 text-xs text-white/40">({t.excluido_em ? tempoRelativo(t.excluido_em) : "—"})</span>
              </td>
              <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="inline-flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={emAndamentoId === t.id}
                    onClick={() => executar(t, () => restaurarTicket(t.id), `Ticket #${t.numero} restaurado.`)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                  </Button>
                  <Button size="sm" variant="danger" disabled={emAndamentoId === t.id} onClick={() => setApagando(t)}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir definitivamente
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={apagando !== null}
        danger
        title="Excluir definitivamente?"
        description={
          apagando && (
            <>
              O ticket <strong className="text-white">#{apagando.numero} – {apagando.titulo}</strong> e todo o seu
              histórico serão apagados sem volta.
            </>
          )
        }
        confirmLabel="Excluir definitivamente"
        loading={apagando !== null && emAndamentoId === apagando.id}
        onConfirm={() =>
          apagando &&
          executar(apagando, () => excluirTicketDefinitivamente(apagando), `Ticket #${apagando.numero} excluído definitivamente.`)
        }
        onCancel={() => setApagando(null)}
      />
    </div>
  );
}
