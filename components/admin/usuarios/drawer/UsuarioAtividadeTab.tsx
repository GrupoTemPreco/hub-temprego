"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatarData } from "@/lib/format";
import { carregarTicketsUsuario, type TicketResumo } from "@/lib/admin/usuarioDetalhe";
import { TicketStatusBadge } from "@/components/tickets/TicketBadges";

function ListaTickets({ titulo, tickets }: { titulo: string; tickets: TicketResumo[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white/80">
        {titulo} <span className="font-normal text-white/45">({tickets.length})</span>
      </h3>
      {tickets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-sm text-white/45">
          Nenhum ticket.
        </p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-14 shrink-0 font-mono text-white/50">#{t.numero}</span>
              <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
              <TicketStatusBadge status={t.status} />
              <span className="w-20 shrink-0 text-right text-xs text-white/45">{formatarData(t.criado_em)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UsuarioAtividadeTab({ usuarioId }: { usuarioId: string }) {
  const toast = useToast();
  const [dados, setDados] = useState<{ abertos: TicketResumo[]; destinados: TicketResumo[] } | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarTicketsUsuario(usuarioId)
      .then((res) => ativo && setDados(res))
      .catch((err) => {
        toast.error(`Erro ao carregar atividade: ${err.message}`);
        if (ativo) setDados({ abertos: [], destinados: [] });
      });
    return () => {
      ativo = false;
    };
  }, [usuarioId, toast]);

  if (!dados) return <p className="text-sm text-white/60">Carregando atividade...</p>;

  if (dados.abertos.length === 0 && dados.destinados.length === 0) {
    return <EmptyState compact title="Sem atividade" description="Este usuário ainda não abriu nem recebeu tickets." />;
  }

  return (
    <div className="space-y-5">
      <ListaTickets titulo="Tickets abertos por ele" tickets={dados.abertos} />
      <ListaTickets titulo="Tickets destinados a ele" tickets={dados.destinados} />
    </div>
  );
}
