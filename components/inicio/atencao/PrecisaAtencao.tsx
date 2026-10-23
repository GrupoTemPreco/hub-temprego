"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { CardRolavel, TotalCard, VazioCard, type AlturaCard } from "@/components/ui/CardRolavel";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import type { DadosChecklist } from "@/components/checklist/useChecklistDados";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { useTicketNaUrl } from "@/hooks/useTicketNaUrl";
import { montarAtencaoPessoal } from "@/lib/precisaAtencao";
import { PAINEL_ENVIADAS, rotaChecklist } from "@/lib/telaAtual";
import { LinhaAtencao } from "./LinhaAtencao";
import { linhaPessoal, type ContextoLinhas } from "./linhasPessoais";
import { linhasAdmin, type DadosAtencaoAdmin } from "./itensAdmin";

type Props = {
  /** Nulo sem acesso ao checklist. Vem da página, que já carrega e assina o checklist. */
  checklist: DadosChecklist | null;
  /** Só no Início do admin: contagens gerais, que entram depois dos itens pessoais. */
  admin?: DadosAtencaoAdmin;
  altura: AlturaCard;
};

/**
 * Pendências pessoais (checklist e tickets) e, para o admin, as gerais. Usa só dados que já estão
 * em memória e são mantidos pelo tempo real (checklist, envios e tickets); não consulta o banco.
 */
export function PrecisaAtencao({ checklist, admin, altura }: Props) {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const envios = useChecklistEnvios();
  const { tickets } = useTicketsUsuario();
  const ticketUrl = useTicketNaUrl();
  const itensChecklist = checklist?.itens;
  const acessoChecklist = Boolean(checklist);

  const pessoais = useMemo(
    () =>
      montarAtencaoPessoal({
        usuarioId: usuario.id,
        setores: usuario.setores,
        acessoChecklist,
        recebidos: envios.recebidos,
        lotes: envios.lotes,
        itensChecklist: itensChecklist ?? [],
        tickets,
      }),
    [usuario.id, usuario.setores, acessoChecklist, envios.recebidos, envios.lotes, itensChecklist, tickets],
  );

  const contexto: ContextoLinhas = {
    nomeDe: envios.nomeDe,
    abrirChecklist: (itemId) => router.push(rotaChecklist(usuario.isAdmin, itemId), { scroll: false }),
    abrirEnviadas: () => router.push(rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS), { scroll: false }),
    abrirTicket: (numero) => ticketUrl.abrir(numero),
    desfixar: (itemId) => void checklist?.acoes.alterarItem(itemId, { fixado: false }, "Não foi possível desfixar"),
    ciente: (lote) => void envios.marcarCiente(lote),
    podeAlterar: (itemId) => {
      const item = checklist?.itens.find((i) => i.id === itemId);
      const editavel = item ? checklist?.acessoDe(item.grupo_id).podeEditar : false;
      return Boolean(editavel) && envios.situacaoDoItem(itemId)?.tipo !== "aguardando";
    },
  };
  const linhas = [...pessoais.map((i) => linhaPessoal(i, contexto)), ...(admin ? linhasAdmin(admin) : [])];

  return (
    <CardRolavel
      altura={altura}
      titulo={
        <>
          <AlertCircle className="h-4 w-4 text-rose-400" />
          Precisa da sua atenção
          <TotalCard total={linhas.length} />
        </>
      }
    >
      {linhas.length === 0 ? (
        <VazioCard>Tudo em dia</VazioCard>
      ) : (
        <ul className="space-y-2">
          {linhas.map((linha) => (
            <LinhaAtencao key={linha.id} linha={linha} />
          ))}
        </ul>
      )}
    </CardRolavel>
  );
}
