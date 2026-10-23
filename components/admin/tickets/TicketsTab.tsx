"use client";

import { useEffect, useState } from "react";
import { Ticket as TicketIcon, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { TicketDrawer } from "@/components/tickets/painel/TicketDrawer";
import {
  contarAtalhos,
  listarLixeira,
  listarTickets,
  type ContagemAtalhos,
  type TicketListagem,
} from "@/lib/admin/ticketsConsulta";
import { carregarReferencias, type Referencias } from "@/lib/ticketsApi";
import type { Ticket } from "@/lib/types/shell";
import { useTicketsUrl } from "./useTicketsUrl";
import { TicketsToolbar } from "./TicketsToolbar";
import { TicketsFiltros } from "./TicketsFiltros";
import { TicketsLista } from "./TicketsLista";
import { TicketsKanban } from "./TicketsKanban";
import { TicketsLixeira } from "./TicketsLixeira";
import { NovoTicketModal } from "./NovoTicketModal";
import { TicketsAcoesMassa } from "./TicketsAcoesMassa";
import { useSelecao } from "@/hooks/useSelecao";
function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function TicketsTab() {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const { filtros, visao, lixeira, ticketAberto, alterar, limparFiltros } = useTicketsUrl();
  const { versao, atualizar } = useTicketsUsuario();
  const [referencias, setReferencias] = useState<Referencias | null>(null);
  const [resultado, setResultado] = useState<{ chave: string; lista: TicketListagem[] } | null>(null);
  const [contagem, setContagem] = useState<ContagemAtalhos | null>(null);
  const [criando, setCriando] = useState(false);
  const [limpezas, setLimpezas] = useState(0);
  // Tickets já vistos nesta aba: a seleção continua valendo para os que saíram da tela com a troca de filtro.
  const [conhecidos, setConhecidos] = useState<Map<string, Ticket>>(() => new Map());
  const chaveFiltros = JSON.stringify(filtros);
  const chaveConsulta = `${chaveFiltros}|${lixeira}|${visao}`;
  const tickets = resultado?.chave === chaveConsulta ? resultado.lista : null;
  const idsVisiveis = tickets?.map((t) => t.id) ?? [];
  // Lista e lixeira têm ações diferentes, então cada uma tem a sua seleção. No kanban não há seleção.
  const selecaoLista = useSelecao(!lixeira && visao === "lista" ? idsVisiveis : []);
  const selecaoLixeira = useSelecao(lixeira ? idsVisiveis : []);
  const selecao = lixeira ? selecaoLixeira : selecaoLista;
  const selecionados = selecao.ids.map((id) => conhecidos.get(id)).filter((t): t is Ticket => Boolean(t));
  const comSelecao = lixeira || visao === "lista";

  useEffect(() => {
    carregarReferencias()
      .then(setReferencias)
      .catch((err) => toast.error(`Erro ao carregar usuários e setores: ${mensagemErro(err)}`));
  }, [toast]);

  useEffect(() => {
    contarAtalhos({ id: usuario.id, setores: usuario.setores })
      .then(setContagem)
      .catch((err) => toast.error(`Erro ao contar tickets: ${mensagemErro(err)}`));
  }, [usuario.id, usuario.setores, versao, toast]);

  useEffect(() => {
    let ativo = true;
    const f = JSON.parse(chaveFiltros) as typeof filtros;
    const chave = `${chaveFiltros}|${lixeira}|${visao}`;
    (lixeira ? listarLixeira(f.q) : listarTickets(f, { id: usuario.id, setores: usuario.setores }, visao))
      .then((lista) => {
        if (!ativo) return;
        setResultado({ chave, lista });
        setConhecidos((prev) => {
          const mapa = new Map(prev);
          for (const t of lista) mapa.set(t.id, t);
          return mapa;
        });
      })
      .catch((err) => {
        toast.error(`Erro ao carregar tickets: ${mensagemErro(err)}`);
        if (ativo) setResultado({ chave, lista: [] });
      });
    return () => {
      ativo = false;
    };
  }, [chaveFiltros, lixeira, visao, usuario.id, usuario.setores, versao, toast]);

  const abrir = (t: Ticket) => alterar({ ticket: String(t.numero) });

  function aoCriar(criado: Pick<Ticket, "numero">) {
    setCriando(false);
    toast.success(`Ticket #${criado.numero} criado.`);
    atualizar();
    alterar({ ticket: String(criado.numero), lixeira: null });
  }

  function renderConteudo() {
    if (!tickets || !referencias) return <p className="p-4 text-sm text-white/60">Carregando tickets...</p>;
    if (lixeira) {
      return tickets.length === 0 ? (
        <EmptyState icon={Trash2} title="A lixeira está vazia" description="Tickets excluídos aparecem aqui." />
      ) : (
        <TicketsLixeira
          tickets={tickets}
          nomes={referencias.nomes}
          selecao={selecaoLixeira}
          onAbrir={abrir}
          onAlterado={atualizar}
        />
      );
    }
    if (visao === "kanban") {
      return (
        <>
          <p className="px-4 pt-3 text-xs text-white/40">Para ações em massa, use a visualização em lista.</p>
          <TicketsKanban tickets={tickets} nomes={referencias.nomes} mostrarEncerrados={filtros.encerrados} onAbrir={abrir} />
        </>
      );
    }
    return tickets.length === 0 ? (
      <EmptyState icon={TicketIcon} title="Nenhum ticket encontrado" description="Ajuste a busca ou os filtros." />
    ) : (
      <TicketsLista tickets={tickets} nomes={referencias.nomes} selecao={selecaoLista} onAbrir={abrir} />
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="space-y-4 border-b border-white/10 p-4">
        <TicketsToolbar
          key={limpezas}
          q={filtros.q}
          visao={visao}
          lixeira={lixeira}
          totalLixeira={contagem?.lixeira ?? 0}
          alterar={alterar}
          onNovo={() => setCriando(true)}
        />
        {!lixeira && (
          <TicketsFiltros
            filtros={filtros}
            referencias={referencias}
            contagem={contagem}
            alterar={alterar}
            onLimpar={() => {
              setLimpezas((n) => n + 1);
              limparFiltros();
            }}
          />
        )}
      </div>

      {renderConteudo()}

      {comSelecao && referencias && (
        <TicketsAcoesMassa
          selecionados={selecionados}
          lixeira={lixeira}
          referencias={referencias}
          onLimpar={selecao.limpar}
          onConcluido={atualizar}
        />
      )}

      {criando && (
        <NovoTicketModal
          onClose={() => setCriando(false)}
          onCriado={aoCriar}
          onVariosCriados={() => {
            setCriando(false);
            atualizar();
          }}
        />
      )}

      {ticketAberto && referencias && (
        <TicketDrawer
          key={ticketAberto}
          numero={ticketAberto}
          referencias={referencias}
          versao={versao}
          onClose={() => alterar({ ticket: null })}
          onAlterado={atualizar}
        />
      )}
    </section>
  );
}
