"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  SetorComHistoricoError,
  alterarAtivoSetor,
  excluirSetor,
  setorTemHistorico,
  type SetorLista,
} from "@/lib/admin/setores";

type Etapa = "verificando" | "confirmar" | "historico";

type Props = {
  setor: SetorLista;
  onFechar: () => void;
  onConcluido: () => Promise<void>;
};

function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function ExcluirSetorFluxo({ setor, onFechar, onConcluido }: Props) {
  const toast = useToast();
  const [etapa, setEtapa] = useState<Etapa>("verificando");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setorTemHistorico(setor.id)
      .then((tem) => ativo && setEtapa(tem ? "historico" : "confirmar"))
      .catch((err) => {
        toast.error(`Erro ao verificar o setor: ${mensagemErro(err)}`);
        onFechar();
      });
    return () => {
      ativo = false;
    };
  }, [setor.id, toast, onFechar]);

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setProcessando(true);
    try {
      await acao();
      toast.success(sucesso);
      await onConcluido();
      onFechar();
    } catch (err) {
      if (err instanceof SetorComHistoricoError) setEtapa("historico");
      else toast.error(mensagemErro(err));
    } finally {
      setProcessando(false);
    }
  }

  if (etapa === "verificando") return null;

  if (etapa === "historico") {
    return (
      <ConfirmDialog
        open
        title="Este setor não pode ser excluído"
        description={
          <>
            <strong className="text-white">{setor.nome}</strong> tem tickets ou eventos no histórico e não pode ser
            apagado.{" "}
            {setor.ativo
              ? "Você pode desativá-lo: ele deixa de receber tickets novos e o histórico é mantido."
              : "Ele já está desativado e não recebe tickets novos."}
          </>
        }
        confirmLabel={setor.ativo ? "Desativar setor" : "Entendi"}
        loading={processando}
        onConfirm={() =>
          setor.ativo ? executar(() => alterarAtivoSetor(setor, false), `Setor ${setor.nome} desativado.`) : onFechar()
        }
        onCancel={onFechar}
      />
    );
  }

  return (
    <ConfirmDialog
      open
      danger
      title="Excluir setor?"
      description={
        <>
          O setor <strong className="text-white">{setor.nome}</strong> será apagado e os membros serão desvinculados.
          Esta ação não pode ser desfeita.
        </>
      }
      confirmLabel="Excluir setor"
      loading={processando}
      onConfirm={() => executar(() => excluirSetor(setor), `Setor ${setor.nome} excluído.`)}
      onCancel={onFechar}
    />
  );
}
