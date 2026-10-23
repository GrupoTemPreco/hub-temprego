import { formatarPrazo } from "@/lib/checklistRegras";
import { agruparLotes, idDoLote } from "@/lib/checklistLotes";
import type { ChecklistEnvio } from "@/lib/types/shell";
import type { AvisoChecklist } from "./useAvisosChecklist";
import { motivosRecusa, paraUmaPessoa, type Nomes } from "./textosLote";

/** Texto do prazo combinado no aceite (o que a RPC gravou em prazo_resposta). */
export function textoPrazoCombinado(envio: Pick<ChecklistEnvio, "prazo_resposta">) {
  return envio.prazo_resposta ? `Prazo combinado: ${formatarPrazo(envio.prazo_resposta)}` : "Sem prazo combinado";
}

type Contexto = Nomes & {
  meuId: string;
  /** Envios do usuário como estavam antes desta mudança (para saber como o lote fica). */
  enviadosAntes: ChecklistEnvio[];
};

function avisoParaQuemEnviou(envio: ChecklistEnvio, antes: ChecklistEnvio | undefined, ctx: Contexto) {
  if (antes?.status !== "pendente") return null;
  const loteId = idDoLote(envio);
  const recebidoEm = new Date().toISOString();

  if (envio.status === "aceito") {
    const setor = envio.setor_id ? ` (enviada para ${ctx.nomeSetor(envio.setor_id)})` : "";
    const resposta = envio.resposta ? `"${envio.resposta}" · ` : "";
    return {
      chave: `aceito:${loteId}`,
      titulo: `${ctx.nomeDe(envio.para_usuario_id)} aceitou ${envio.titulo}${setor}`,
      detalhe: `${resposta}${textoPrazoCombinado(envio)}`,
      destino: { tipo: "enviadas" },
      loteId,
      cienteAoDispensar: true,
      recebidoEm,
    } satisfies AvisoChecklist;
  }

  if (envio.status === "recusado") {
    // Recusa individual não avisa; só quando o lote inteiro ficou recusado.
    const doLote = [...ctx.enviadosAntes.filter((e) => idDoLote(e) === loteId && e.id !== envio.id), envio];
    const [lote] = agruparLotes(doLote);
    if (lote.status !== "recusado") return null;
    return {
      chave: `recusado:${loteId}`,
      titulo: paraUmaPessoa(lote)
        ? `${ctx.nomeDe(envio.para_usuario_id)} recusou ${envio.titulo}`
        : `Todos recusaram ${envio.titulo}`,
      detalhe: motivosRecusa(lote, ctx).join(" · ") || undefined,
      destino: envio.item_id ? { tipo: "item", itemId: envio.item_id } : { tipo: "checklist" },
      loteId,
      recebidoEm,
    } satisfies AvisoChecklist;
  }
  return null;
}

function avisoParaQuemRecebeu(envio: ChecklistEnvio, antes: ChecklistEnvio | undefined, ctx: Contexto) {
  if (envio.status !== "pendente") return null;
  const quem = ctx.nomeDe(envio.de_usuario_id);
  const base = { destino: { tipo: "recebidas" as const }, envioRecebidoId: envio.id, recebidoEm: new Date().toISOString() };
  if (!antes) {
    return { ...base, chave: `recebido:${envio.id}`, titulo: `${quem} te enviou uma tarefa: ${envio.titulo}`, detalhe: envio.mensagem ?? undefined };
  }
  if (envio.reenvios > antes.reenvios) {
    return { ...base, chave: `reenvio:${envio.id}:${envio.reenvios}`, titulo: `${quem} reenviou: ${envio.titulo}`, detalhe: envio.mensagem ?? undefined };
  }
  return null;
}

/**
 * Aviso para uma mudança de envio que chegou pelo tempo real, ou nulo se não houver o que avisar.
 * `antes` é a versão que já estava em memória (o Realtime não manda o registro antigo).
 */
export function avisoDoEnvio(envio: ChecklistEnvio, antes: ChecklistEnvio | undefined, ctx: Contexto): AvisoChecklist | null {
  return envio.de_usuario_id === ctx.meuId ? avisoParaQuemEnviou(envio, antes, ctx) : avisoParaQuemRecebeu(envio, antes, ctx);
}
