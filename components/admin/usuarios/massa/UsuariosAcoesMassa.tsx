"use client";

import { useState } from "react";
import { Building2, Inbox, KeyRound, ListChecks, UserCheck } from "lucide-react";
import { BarraAcoesMassa, type AcaoMassa } from "@/components/ui/BarraAcoesMassa";
import { useConfirmacaoMassa } from "@/components/ui/ConfirmacaoMassa";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { quantidade } from "@/lib/acoesMassa";
import { PERMISSOES_DISPONIVEIS } from "@/lib/permissoes";
import {
  ROTULO_CAMPO,
  ligarEmMassa,
  permissoesEmMassa,
  setoresEmMassa,
  statusEmMassa,
  type CampoLigavel,
  type StatusMassa,
} from "@/lib/admin/usuariosMassa";
import type { UsuarioLista } from "@/lib/admin/usuarios";
import type { Setor } from "@/lib/types/shell";
import { SetoresMassaModal } from "./SetoresMassaModal";
import { PermissoesMassaModal } from "./PermissoesMassaModal";

const usuariosTexto = (n: number) => quantidade(n, "usuário", "usuários");
const rotuloPermissao = (key: string) => PERMISSOES_DISPONIVEIS.find((p) => p.key === key)?.label ?? key;

type Props = {
  selecionados: UsuarioLista[];
  setores: Setor[];
  onLimpar: () => void;
  /** Recarrega a lista; a seleção é mantida. */
  onConcluido: () => Promise<void>;
};

/** Barra de ações em massa da aba Usuários (sem o interruptor de administrador, de propósito). */
export function UsuariosAcoesMassa({ selecionados, setores, onLimpar, onConcluido }: Props) {
  const toast = useToast();
  const usuarioAtual = useUsuarioAtual();
  const { pedir, executando, dialogo } = useConfirmacaoMassa();
  const [modal, setModal] = useState<"setores" | "permissoes" | null>(null);
  const texto = usuariosTexto(selecionados.length);
  const incluiVoce = selecionados.some((u) => u.id === usuarioAtual.id);

  async function depois() {
    await onConcluido();
    if (incluiVoce) await usuarioAtual.recarregarUsuario();
  }

  function pedirStatus(status: StatusMassa) {
    // Como no Drawer, ninguém altera o próprio status.
    const alvos = selecionados.filter((u) => u.id !== usuarioAtual.id);
    if (alvos.length === 0) {
      toast.error("Não é possível alterar o seu próprio status.");
      return;
    }
    const aprovar = status === "aprovado";
    pedir({
      titulo: `${aprovar ? "Aprovar" : "Rejeitar"} ${usuariosTexto(alvos.length)}?`,
      descricao: incluiVoce ? "Você está na seleção e fica de fora: não é possível alterar o próprio status." : undefined,
      rotuloConfirmar: aprovar ? "Aprovar" : "Rejeitar",
      perigo: !aprovar,
      executar: () => statusEmMassa(alvos, status),
      sucesso: (n) => `${usuariosTexto(n)} ${aprovar ? "aprovados" : "rejeitados"}.`,
      depois,
    });
  }

  function pedirLigar(campo: CampoLigavel, valor: boolean) {
    const acao = valor ? "Ligar" : "Desligar";
    pedir({
      titulo: `${acao} ${ROTULO_CAMPO[campo]} para ${texto}?`,
      rotuloConfirmar: acao,
      executar: () => ligarEmMassa(selecionados, campo, valor),
      sucesso: (n) => `${ROTULO_CAMPO[campo]} ${valor ? "ligado" : "desligado"} para ${usuariosTexto(n)}.`,
      depois,
    });
  }

  const opcoesLigar = (campo: CampoLigavel) => [
    { id: `${campo}-ligar`, rotulo: "Ligar", onClick: () => pedirLigar(campo, true) },
    { id: `${campo}-desligar`, rotulo: "Desligar", onClick: () => pedirLigar(campo, false) },
  ];

  const acoes: AcaoMassa[] = [
    {
      id: "status",
      rotulo: "Status",
      icone: UserCheck,
      opcoes: [
        { id: "aprovar", rotulo: "Aprovar", onClick: () => pedirStatus("aprovado") },
        { id: "rejeitar", rotulo: "Rejeitar", perigo: true, onClick: () => pedirStatus("rejeitado") },
      ],
    },
    { id: "setores", rotulo: "Setores", icone: Building2, onClick: () => setModal("setores") },
    { id: "recebe", rotulo: "Recebe tickets", icone: Inbox, opcoes: opcoesLigar("recebe_tickets") },
    { id: "checklist", rotulo: "Acesso ao checklist", icone: ListChecks, opcoes: opcoesLigar("acesso_checklist") },
    { id: "permissoes", rotulo: "Permissões", icone: KeyRound, onClick: () => setModal("permissoes") },
  ];

  return (
    <>
      <BarraAcoesMassa total={selecionados.length} acoes={acoes} onLimpar={onLimpar} ocupado={executando} />

      {modal === "setores" && (
        <SetoresMassaModal
          setores={setores}
          onClose={() => setModal(null)}
          onEscolher={(modo, escolhidos) => {
            setModal(null);
            const nomes = escolhidos.map((s) => s.nome);
            const lista = nomes.join(", ") || "nenhum setor";
            const titulo = {
              adicionar: `Adicionar ${texto} a ${lista}?`,
              remover: `Remover ${texto} de ${lista}?`,
              substituir: `Substituir os setores de ${texto} por ${lista}?`,
            }[modo];
            pedir({
              titulo,
              executar: () => setoresEmMassa(selecionados, modo, escolhidos.map((s) => s.id), nomes),
              sucesso: (n) => `Setores atualizados para ${usuariosTexto(n)}.`,
              depois,
            });
          }}
        />
      )}

      {modal === "permissoes" && (
        <PermissoesMassaModal
          onClose={() => setModal(null)}
          onEscolher={(mudancas) => {
            setModal(null);
            const conceder = Object.entries(mudancas).filter(([, m]) => m === "conceder").map(([k]) => rotuloPermissao(k));
            const remover = Object.entries(mudancas).filter(([, m]) => m === "remover").map(([k]) => rotuloPermissao(k));
            pedir({
              titulo: `Alterar permissões de ${texto}?`,
              descricao: (
                <ul className="space-y-1">
                  {conceder.length > 0 && <li>Conceder: {conceder.join(", ")}</li>}
                  {remover.length > 0 && <li>Remover: {remover.join(", ")}</li>}
                </ul>
              ),
              executar: () => permissoesEmMassa(selecionados, mudancas),
              sucesso: (n) => `Permissões atualizadas para ${usuariosTexto(n)}.`,
              depois,
            });
          }}
        />
      )}

      {dialogo}
    </>
  );
}
