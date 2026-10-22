import {
  Activity,
  ArchiveRestore,
  Flag,
  Forward,
  Lock,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AnexosExibicao } from "@/components/tickets/anexos/AnexosExibicao";
import type { AnexoExibicao } from "@/hooks/useAnexosTicket";
import { tempoRelativo } from "@/lib/format";
import { fraseEvento, type ResolvedorNomes } from "@/lib/tickets";
import type { Ticket, TicketEvento, TicketEventoTipo } from "@/lib/types/shell";

const ICONES: Partial<Record<TicketEventoTipo, typeof Activity>> = {
  criado: PlusCircle,
  status: RefreshCw,
  reaberto: RotateCcw,
  encaminhado: Forward,
  assumido: UserCheck,
  prioridade: Flag,
  excluido: Trash2,
  restaurado: ArchiveRestore,
};

type Props = {
  ticket: Ticket;
  eventos: TicketEvento[];
  nomes: ResolvedorNomes;
  anexosPorEvento: Map<string, AnexoExibicao[]>;
  onAbrirImagem: (anexoId: string) => void;
};

type PropsMensagem = {
  evento: TicketEvento;
  nomes: ResolvedorNomes;
  anexos: AnexoExibicao[];
  onAbrirImagem: (anexoId: string) => void;
};

function Mensagem({ evento, nomes, anexos, onAbrirImagem }: PropsMensagem) {
  const autor = nomes.usuario(evento.autor_id);
  return (
    <li className="flex gap-3">
      <Avatar nome={autor} />
      <div
        className={`min-w-0 flex-1 rounded-lg border px-3 py-2 ${
          evento.interno ? "border-amber-400/30 bg-amber-500/8" : "border-white/10 bg-white/4"
        }`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-medium text-white">{autor}</span>
          <span className="text-white/40">{tempoRelativo(evento.criado_em)}</span>
          {evento.interno && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
              <Lock className="h-3 w-3" /> Nota interna – visível só para admins
            </span>
          )}
        </div>
        {evento.mensagem && <p className="whitespace-pre-wrap text-sm text-white/85">{evento.mensagem}</p>}
        <AnexosExibicao anexos={anexos} onAbrirImagem={onAbrirImagem} />
      </div>
    </li>
  );
}

function EventoSistema({ evento, ticket, nomes }: { evento: TicketEvento; ticket: Ticket; nomes: ResolvedorNomes }) {
  const Icon = ICONES[evento.tipo] ?? Activity;
  return (
    <li className="flex items-center gap-3 pl-1.5 text-xs text-white/55">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-3 w-3" />
      </span>
      <span className="min-w-0">
        <span className="font-medium text-white/75">{nomes.usuario(evento.autor_id)}</span>{" "}
        {fraseEvento(evento, { nomes, ticket })}
        <span className="ml-1.5 text-white/35">· {tempoRelativo(evento.criado_em)}</span>
      </span>
    </li>
  );
}

export function TicketTimeline({ ticket, eventos, nomes, anexosPorEvento, onAbrirImagem }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">Linha do tempo</h3>
      {eventos.length === 0 ? (
        <p className="text-sm text-white/40">Nenhum evento registrado.</p>
      ) : (
        <ol className="space-y-3">
          {eventos.map((e) =>
            e.tipo === "mensagem" ? (
              <Mensagem
                key={e.id}
                evento={e}
                nomes={nomes}
                anexos={anexosPorEvento.get(e.id) ?? []}
                onAbrirImagem={onAbrirImagem}
              />
            ) : (
              <EventoSistema key={e.id} evento={e} ticket={ticket} nomes={nomes} />
            ),
          )}
        </ol>
      )}
    </div>
  );
}
