"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  MSG_EXCLUSAO_COM_ENVIO,
  carregarArquivadas,
  excluirListaDefinitivamente,
  temEnvioPendente,
  type CargaArquivadas,
} from "@/lib/checklistArquivadas";
import type { ChecklistGrupo } from "@/lib/types/shell";

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

type Params = {
  usuarioId: string;
  /** Restaura na grade (useChecklistDados): a lista volta no fim, com os itens e membros. */
  restaurarNaGrade: (id: string) => Promise<boolean>;
};

/** Listas arquivadas do usuário (dono) para o botão e o Drawer "Arquivadas". */
export function useListasArquivadas({ usuarioId, restaurarNaGrade }: Params) {
  const toast = useToast();
  const [carga, setCarga] = useState<CargaArquivadas | null>(null);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let vivo = true;
    carregarArquivadas(usuarioId)
      .then((c) => vivo && setCarga(c))
      .catch((err) => console.error("[checklist] Falha ao carregar listas arquivadas:", err));
    return () => {
      vivo = false;
    };
  }, [usuarioId, versao]);

  const itensDe = (lista: ChecklistGrupo) => carga?.itens.filter((i) => i.grupo_id === lista.id) ?? [];

  async function restaurar(lista: ChecklistGrupo) {
    const ok = await restaurarNaGrade(lista.id);
    if (ok) toast.success(`Lista "${lista.nome}" restaurada.`);
    recarregar();
    return ok;
  }

  /** Antes da confirmação: bloqueia se algum item tiver envio aguardando resposta. */
  async function podeExcluir(lista: ChecklistGrupo) {
    try {
      if (await temEnvioPendente(itensDe(lista).map((i) => i.id))) {
        toast.error(MSG_EXCLUSAO_COM_ENVIO);
        return false;
      }
      return true;
    } catch (err) {
      toast.error(`Não foi possível verificar os envios: ${mensagem(err)}`);
      return false;
    }
  }

  async function excluir(lista: ChecklistGrupo) {
    try {
      await excluirListaDefinitivamente(lista.id);
      toast.success(`Lista "${lista.nome}" excluída definitivamente.`);
      recarregar();
      return true;
    } catch (err) {
      toast.error(`Não foi possível excluir a lista: ${mensagem(err)}`);
      return false;
    }
  }

  return { carga, total: carga?.listas.length ?? 0, itensDe, recarregar, restaurar, podeExcluir, excluir };
}

export type ListasArquivadas = ReturnType<typeof useListasArquivadas>;
