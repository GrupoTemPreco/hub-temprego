"use client";

import { useNotificacoesUsuario } from "@/components/notificacoes/NotificacoesUsuarioProvider";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { ordenarParaMural } from "@/lib/notificacoes";
import { CardAviso } from "./mural/CardAviso";
import { CardAvisoTickets } from "./mural/CardAvisoTickets";
import { ID_SECAO_TICKETS } from "./CardMeusTickets";

/**
 * Aviso de tickets (quando houver) e as notificações ativas para a pessoa,
 * de qualquer formato, inclusive as já fechadas.
 */
export function MuralAvisos() {
  const { ativas } = useNotificacoesUsuario();
  const { classificados, novidades } = useTicketsUsuario();

  const recebidosComNovidade = [...classificados.semResponsavelDoSetor, ...classificados.recebidos].filter((t) =>
    novidades.has(t.id),
  ).length;
  const setorSemResponsavel = classificados.semResponsavelDoSetor.length;

  const itens = ordenarParaMural(ativas).map((n) => ({ id: n.id, conteudo: <CardAviso notificacao={n} /> }));
  if (recebidosComNovidade > 0 || setorSemResponsavel > 0) {
    itens.unshift({
      id: "sistema-tickets",
      conteudo: (
        <CardAvisoTickets
          recebidosComNovidade={recebidosComNovidade}
          setorSemResponsavel={setorSemResponsavel}
          onVerRecebidos={() =>
            document.getElementById(ID_SECAO_TICKETS)?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />
      ),
    });
  }
  if (itens.length === 0) return null;

  // Grade de até 3 colunas; com um aviso só, ele ocupa uma coluna sem esticar.
  return (
    <section aria-label="Mural de avisos">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Mural de avisos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {itens.map((item) => (
          <div key={item.id} className="flex min-w-0">
            {item.conteudo}
          </div>
        ))}
      </div>
    </section>
  );
}
