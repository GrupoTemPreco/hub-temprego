"use client";

import { useState } from "react";
import { ArrowRightLeft, Flag, RotateCcw, Trash2, UserCheck, Workflow } from "lucide-react";
import { BarraAcoesMassa, type AcaoMassa } from "@/components/ui/BarraAcoesMassa";
import { useConfirmacaoMassa } from "@/components/ui/ConfirmacaoMassa";
import { EscolhaModal, type OpcaoEscolha } from "@/components/ui/EscolhaModal";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { aplicarEmMassa, excluirDefinitivamenteEmMassa, ticketsTexto } from "@/lib/admin/ticketsMassa";
import { PRIORIDADES_TICKET, STATUS_TICKET } from "@/lib/tickets";
import { decodificarDestino, type DestinoValor, type Referencias } from "@/lib/ticketsApi";
import type { Ticket, TicketPrioridade, TicketStatus } from "@/lib/types/shell";

type Escolha = "status" | "prioridade" | "encaminhar" | "responsavel";

/** Resumo da confirmação, ação e frase do log, e campos gravados, para cada ação que pede uma escolha. */
const MASSA_COM_ESCOLHA: Record<
  Escolha,
  {
    acao: string;
    titulo: (tickets: string, escolha: string) => string;
    descricao: (tickets: string, escolha: string) => string;
    campos: (valor: string) => Partial<Ticket>;
  }
> = {
  status: {
    acao: "massa_status_tickets",
    titulo: (t, e) => `Mudar o status de ${t} para "${e}"?`,
    descricao: (t, e) => `alterou o status de ${t} para "${e}"`,
    campos: (v) => ({ status: v as TicketStatus }),
  },
  prioridade: {
    acao: "massa_prioridade_tickets",
    titulo: (t, e) => `Mudar a prioridade de ${t} para "${e}"?`,
    descricao: (t, e) => `alterou a prioridade de ${t} para "${e}"`,
    campos: (v) => ({ prioridade: v as TicketPrioridade }),
  },
  encaminhar: {
    acao: "massa_encaminhar_tickets",
    titulo: (t, e) => `Encaminhar ${t} para ${e}?`,
    descricao: (t, e) => `encaminhou ${t} para ${e}`,
    campos: (v) => decodificarDestino(v as DestinoValor),
  },
  responsavel: {
    acao: "massa_responsavel_tickets",
    titulo: (t, e) => `Atribuir ${t} a ${e}?`,
    descricao: (t, e) => `atribuiu ${t} a ${e}`,
    campos: (v) => ({ responsavel_id: v }),
  },
};

type Props = {
  selecionados: Ticket[];
  lixeira: boolean;
  referencias: Referencias;
  onLimpar: () => void;
  onConcluido: () => void;
};

/** Ações em massa da lista de tickets; na lixeira, só Restaurar e Excluir definitivamente. */
export function TicketsAcoesMassa({ selecionados, lixeira, referencias, onLimpar, onConcluido }: Props) {
  const usuario = useUsuarioAtual();
  const { pedir, executando, dialogo } = useConfirmacaoMassa();
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const texto = ticketsTexto(selecionados.length);
  const aprovados = referencias.usuarios.filter((u) => u.status === "aprovado");
  const nomeUsuario = (u: { nome: string | null; email: string | null }) => u.nome || u.email || "Usuário";

  const opcoes: Record<Escolha, { titulo: string; rotulo: string; lista: OpcaoEscolha[] }> = {
    status: { titulo: "Mudar status", rotulo: "Novo status", lista: STATUS_TICKET.map((s) => ({ value: s.value, label: s.label })) },
    prioridade: {
      titulo: "Mudar prioridade",
      rotulo: "Nova prioridade",
      lista: PRIORIDADES_TICKET.map((p) => ({ value: p.value, label: p.label })),
    },
    encaminhar: {
      titulo: "Encaminhar",
      rotulo: "Novo destino",
      lista: [
        ...referencias.setores.filter((s) => s.ativo).map((s) => ({ value: `setor:${s.id}`, label: s.nome, grupo: "Setores" })),
        ...aprovados
          .filter((u) => u.recebe_tickets)
          .map((u) => ({ value: `usuario:${u.id}`, label: nomeUsuario(u), grupo: "Pessoas" })),
      ],
    },
    responsavel: {
      titulo: "Atribuir responsável",
      rotulo: "Responsável",
      lista: aprovados.map((u) => ({ value: u.id, label: nomeUsuario(u) })),
    },
  };

  function aoEscolher(tipo: Escolha, o: OpcaoEscolha) {
    setEscolha(null);
    const m = MASSA_COM_ESCOLHA[tipo];
    pedir({
      titulo: m.titulo(texto, o.label),
      sucesso: (n) => `${ticketsTexto(n)} atualizados.`,
      depois: onConcluido,
      executar: () =>
        aplicarEmMassa(selecionados, { acao: m.acao, descricao: (n) => m.descricao(n, o.label), campos: m.campos(o.value) }),
    });
  }

  // Lixeira, restauração e exclusão tiram os tickets da tela atual: a seleção é limpa.
  const depoisDeSair = () => {
    onLimpar();
    onConcluido();
  };

  const pedirLixeira = () =>
    pedir({
      titulo: `Mover ${texto} para a lixeira?`,
      rotuloConfirmar: "Mover para a lixeira",
      perigo: true,
      sucesso: (n) => `${ticketsTexto(n)} na lixeira.`,
      depois: depoisDeSair,
      executar: () =>
        aplicarEmMassa(selecionados, {
          acao: "massa_lixeira_tickets",
          descricao: (n) => `moveu ${n} para a lixeira`,
          campos: { excluido_em: new Date().toISOString(), excluido_por: usuario.id },
        }),
    });

  const acoes: AcaoMassa[] = lixeira
    ? [
        {
          id: "restaurar",
          rotulo: "Restaurar",
          icone: RotateCcw,
          onClick: () =>
            pedir({
              titulo: `Restaurar ${texto} da lixeira?`,
              rotuloConfirmar: "Restaurar",
              sucesso: (n) => `${ticketsTexto(n)} restaurados.`,
              depois: depoisDeSair,
              executar: () =>
                aplicarEmMassa(selecionados, {
                  acao: "massa_restaurar_tickets",
                  descricao: (n) => `restaurou ${n} da lixeira`,
                  campos: { excluido_em: null, excluido_por: null },
                }),
            }),
        },
        {
          id: "excluir",
          rotulo: "Excluir definitivamente",
          icone: Trash2,
          perigo: true,
          onClick: () =>
            pedir({
              titulo: `Excluir definitivamente ${texto}?`,
              descricao: "Os tickets, o histórico e os arquivos anexados serão apagados sem volta.",
              rotuloConfirmar: "Excluir definitivamente",
              perigo: true,
              sucesso: (n) => `${ticketsTexto(n)} excluídos definitivamente.`,
              depois: depoisDeSair,
              executar: () => excluirDefinitivamenteEmMassa(selecionados),
            }),
        },
      ]
    : [
        { id: "status", rotulo: "Status", icone: Workflow, onClick: () => setEscolha("status") },
        { id: "prioridade", rotulo: "Prioridade", icone: Flag, onClick: () => setEscolha("prioridade") },
        { id: "encaminhar", rotulo: "Encaminhar", icone: ArrowRightLeft, onClick: () => setEscolha("encaminhar") },
        { id: "responsavel", rotulo: "Atribuir responsável", icone: UserCheck, onClick: () => setEscolha("responsavel") },
        { id: "lixeira", rotulo: "Mover para a lixeira", icone: Trash2, perigo: true, onClick: pedirLixeira },
      ];

  return (
    <>
      <BarraAcoesMassa total={selecionados.length} acoes={acoes} onLimpar={onLimpar} ocupado={executando} />
      {escolha && (
        <EscolhaModal
          titulo={`${opcoes[escolha].titulo} · ${texto}`}
          rotulo={opcoes[escolha].rotulo}
          opcoes={opcoes[escolha].lista}
          onEscolher={(o) => aoEscolher(escolha, o)}
          onClose={() => setEscolha(null)}
        />
      )}
      {dialogo}
    </>
  );
}
