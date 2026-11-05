import { agruparLotesLista } from "@/lib/checklistEnviosLista";
import type { ChecklistEnvioLista } from "@/lib/types/shell";
import type { AvisoChecklist } from "./useAvisosChecklist";
import { motivosRecusa, paraUmaPessoa, textoTarefas, type Nomes } from "./textosLote";

type Contexto = Nomes & {
  meuId: string;
  /** Envios de lista do usuário como estavam antes desta mudança. */
  enviadosAntes: ChecklistEnvioLista[];
};

function avisoParaQuemEnviou(envio: ChecklistEnvioLista, antes: ChecklistEnvioLista | undefined, ctx: Contexto) {
  if (antes?.status !== "pendente") return null;
  const loteId = envio.lote_id;
  const recebidoEm = new Date().toISOString();
  const todos = envio.modo === "todos";

  if (envio.status === "aceito") {
    const setor = envio.setor_id ? ` (enviada para ${ctx.nomeSetor(envio.setor_id)})` : "";
    return {
      chave: todos ? `aceito:${envio.id}` : `aceito:${loteId}`,
      titulo: `${ctx.nomeDe(envio.para_usuario_id)} aceitou a lista ${envio.nome}${setor}`,
      detalhe: envio.resposta ? `"${envio.resposta}"` : undefined,
      destino: { tipo: "checklist" },
      loteId,
      cienteAoDispensar: true,
      recebidoEm,
    } satisfies AvisoChecklist;
  }

  if (envio.status === "recusado") {
    if (todos) {
      return {
        chave: `recusado:${envio.id}`,
        titulo: `${ctx.nomeDe(envio.para_usuario_id)} recusou a lista ${envio.nome}`,
        detalhe: envio.resposta || undefined,
        destino: { tipo: "checklist" as const },
        loteId,
        cienteAoDispensar: true,
        recebidoEm,
      } satisfies AvisoChecklist;
    }
    // Recusa individual não avisa; só quando o lote inteiro ficou recusado.
    const doLote = [...ctx.enviadosAntes.filter((e) => e.lote_id === loteId && e.id !== envio.id), envio];
    const [lote] = agruparLotesLista(doLote);
    if (lote.status !== "recusado") return null;
    return {
      chave: `recusado:${loteId}`,
      titulo: paraUmaPessoa(lote)
        ? `${ctx.nomeDe(envio.para_usuario_id)} recusou a lista ${envio.nome}`
        : `Todos recusaram a lista ${envio.nome}`,
      detalhe: motivosRecusa(lote, ctx).join(" · ") || undefined,
      destino: { tipo: "checklist" },
      loteId,
      recebidoEm,
    } satisfies AvisoChecklist;
  }
  return null;
}

function avisoParaQuemRecebeu(envio: ChecklistEnvioLista, antes: ChecklistEnvioLista | undefined, ctx: Contexto) {
  if (envio.status !== "pendente") return null;
  const quem = ctx.nomeDe(envio.de_usuario_id);
  const base = { destino: { tipo: "recebidas" as const }, envioRecebidoId: envio.id, recebidoEm: new Date().toISOString() };
  const lista = `${envio.nome} (${textoTarefas(envio.qtd_tarefas)})`;
  if (!antes) {
    return { ...base, chave: `recebido:${envio.id}`, titulo: `${quem} te enviou uma lista: ${lista}`, detalhe: envio.mensagem ?? undefined };
  }
  if (envio.reenvios > antes.reenvios) {
    return {
      ...base,
      chave: `reenvio:${envio.id}:${envio.reenvios}`,
      titulo: `${quem} reenviou a lista: ${lista}`,
      detalhe: envio.mensagem ?? undefined,
    };
  }
  return null;
}

/** Aviso para uma mudança de envio de lista que chegou pelo tempo real, ou nulo. */
export function avisoDoEnvioLista(
  envio: ChecklistEnvioLista,
  antes: ChecklistEnvioLista | undefined,
  ctx: Contexto,
): AvisoChecklist | null {
  return envio.de_usuario_id === ctx.meuId ? avisoParaQuemEnviou(envio, antes, ctx) : avisoParaQuemRecebeu(envio, antes, ctx);
}
