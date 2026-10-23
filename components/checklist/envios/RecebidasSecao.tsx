"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { useAgora } from "@/hooks/useAgora";
import { buscarItens } from "@/lib/checklist";
import { contarDestinatariosPorLote } from "@/lib/checklistEnvios";
import type { ChecklistEnvio, ChecklistItem } from "@/lib/types/shell";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";
import { RecebidaCard } from "./RecebidaCard";

type Props = {
  onAceitar: (envio: ChecklistEnvio) => void;
  onRecusar: (envio: ChecklistEnvio) => void;
};

/**
 * Quantas pessoas receberam cada envio (lote). Conta só as linhas que o banco deixa o usuário ver:
 * se o acesso mostrar só a dele, o selo "Enviada para N pessoas" não aparece.
 */
function usePessoasPorLote(recebidos: ChecklistEnvio[]) {
  const [contagem, setContagem] = useState<Map<string, number>>(new Map());
  const chave = [...new Set(recebidos.filter((e) => !e.setor_id && e.lote_id).map((e) => e.lote_id!))].sort().join(",");

  useEffect(() => {
    if (!chave) return;
    let vivo = true;
    contarDestinatariosPorLote(chave.split(","))
      .then((mapa) => vivo && setContagem(mapa))
      .catch((err) => console.error("[checklist] Falha ao contar destinatários:", err));
    return () => {
      vivo = false;
    };
  }, [chave]);

  return contagem;
}

function seloDestino(envio: ChecklistEnvio, nomeSetor: (id: string | null) => string, pessoasPorLote: Map<string, number>) {
  if (envio.setor_id) return `Para ${nomeSetor(envio.setor_id)}`;
  const n = envio.lote_id ? pessoasPorLote.get(envio.lote_id) ?? 1 : 1;
  return n > 1 ? `Enviada para ${n} pessoas` : undefined;
}

/** Tarefas enviadas para o usuário e ainda sem resposta; some quando não há nenhuma. */
export function RecebidasSecao({ onAceitar, onRecusar }: Props) {
  const { recebidos, nomeDe, nomeSetor } = useChecklistEnvios();
  const agora = useAgora();
  const pessoasPorLote = usePessoasPorLote(recebidos);
  const [carga, setCarga] = useState<{ chave: string; itens: Map<string, ChecklistItem> }>({
    chave: "",
    itens: new Map(),
  });
  const chave = recebidos
    .map((e) => e.item_id)
    .filter((id): id is string => Boolean(id))
    .join(",");
  const carregando = carga.chave !== chave;

  useEffect(() => {
    if (!chave) return;
    let vivo = true;
    buscarItens(chave.split(","))
      .then((lista) => vivo && setCarga({ chave, itens: new Map(lista.map((i) => [i.id, i])) }))
      .catch((err) => console.error("[checklist] Falha ao carregar itens recebidos:", err));
    return () => {
      vivo = false;
    };
  }, [chave]);

  if (recebidos.length === 0) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50">
        <Inbox className="h-4 w-4" /> Recebidas
        <span className="rounded-full bg-rose-500 px-1.5 text-xs text-white">{recebidos.length}</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recebidos.map((envio) => (
          <RecebidaCard
            key={envio.id}
            envio={envio}
            item={envio.item_id ? (carregando ? undefined : carga.itens.get(envio.item_id) ?? null) : null}
            remetente={nomeDe(envio.de_usuario_id)}
            seloDestino={seloDestino(envio, nomeSetor, pessoasPorLote)}
            agora={agora}
            onAceitar={() => onAceitar(envio)}
            onRecusar={() => onRecusar(envio)}
          />
        ))}
      </div>
    </section>
  );
}
