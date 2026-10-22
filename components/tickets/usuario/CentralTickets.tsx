"use client";

import { Plus } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { nomeDestino } from "@/lib/tickets";
import type { Ticket } from "@/lib/types/shell";
import { ListaTicketsUsuario } from "./ListaTicketsUsuario";
import { NovoTicketUsuario } from "./NovoTicketUsuario";
import { RecebidosTickets } from "./RecebidosTickets";
import { useTicketsUsuario, type AbaTickets } from "./TicketsUsuarioProvider";

const TODAS_AS_ABAS: AbaTickets[] = ["novo", "meus", "recebidos"];

type Props = {
  aba: AbaTickets;
  onAba: (aba: AbaTickets) => void;
  /** `aba` vem preenchida quando a aba também deve mudar (ex.: depois de criar um ticket). */
  onAbrirTicket: (numero: number, aba?: AbaTickets) => void;
  /** Abas exibidas; "recebidos" ainda depende das regras de mostrarRecebidos. */
  abas?: AbaTickets[];
};

/** Abas Novo ticket / Meus tickets / Recebidos; usada no balão e na seção de tickets do Início. */
export function CentralTickets({ aba, onAba, onAbrirTicket, abas = TODAS_AS_ABAS }: Props) {
  const { classificados, mostrarRecebidos, novidades, referencias, carregado } = useTicketsUsuario();
  const disponiveis = abas.filter((a) => a !== "recebidos" || mostrarRecebidos);
  const abaAtual: AbaTickets = disponiveis.includes(aba) ? aba : "meus";
  const comNovidade = (lista: Ticket[]) => lista.filter((t) => novidades.has(t.id)).length;
  const abrir = (t: Ticket) => onAbrirTicket(t.numero);

  const todas: Record<AbaTickets, TabItem<AbaTickets>> = {
    novo: { id: "novo", label: "Novo ticket", icon: Plus },
    meus: { id: "meus", label: "Meus tickets", count: comNovidade(classificados.meus) },
    recebidos: {
      id: "recebidos",
      label: "Recebidos",
      count: comNovidade([...classificados.semResponsavelDoSetor, ...classificados.recebidos, ...classificados.participei]),
    },
  };

  function conteudo() {
    if (abaAtual === "novo") {
      return (
        <NovoTicketUsuario
          onCriado={(numero) => onAbrirTicket(numero, "meus")}
          onVariosCriados={() => onAba("meus")}
        />
      );
    }
    if (!carregado || !referencias) return <p className="text-sm text-white/55">Carregando tickets...</p>;
    if (abaAtual === "recebidos") return <RecebidosTickets onAbrir={abrir} />;
    return (
      <ListaTicketsUsuario
        tickets={classificados.meus}
        outraParte={(t) => `Para ${nomeDestino(t, referencias.nomes)}`}
        novidades={novidades}
        onAbrir={abrir}
        vazio="Você ainda não abriu nenhum ticket."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs variant="underline" items={disponiveis.map((a) => todas[a])} value={abaAtual} onChange={onAba} />
      {conteudo()}
    </div>
  );
}
