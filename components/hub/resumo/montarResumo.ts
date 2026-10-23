import { listarGruposPorIds } from "@/lib/checklist";
import { listarParticipacoes } from "@/lib/checklistMembros";
import { ultimoEnvioEm } from "@/lib/checklistEnvios";
import type { LoteEnvio } from "@/lib/checklistLotes";
import type { ChecklistEnvio, Ticket } from "@/lib/types/shell";
import { paraUmaPessoa } from "@/components/checklist/envios/textosLote";

export type TipoResumo = "recebida" | "aceita" | "recusada" | "lista" | "ticket";

/**
 * Uma coisa que aconteceu enquanto a pessoa estava fora. A `chave` segue o mesmo esquema dos
 * avisos em tempo real (envio, lote, lista, ticket), para não repetir o que já estiver no cartão.
 */
export type EntradaResumo = {
  chave: string;
  tipo: TipoResumo;
  /** Texto quando a entrada é a única do tipo, ex.: `Brenda aceitou "Revisar banners"`. */
  frase: string;
  envioId?: string;
  loteId?: string;
  itemId?: string;
  ticketId?: string;
  ticketNumero?: number;
};

export const chaveEnvio = (id: string) => `envio:${id}`;
export const chaveLote = (id: string) => `lote:${id}`;
export const chaveLista = (id: string) => `lista:${id}`;
export const chaveTicket = (id: string) => `ticket:${id}`;

type Fontes = {
  usuarioId: string;
  desde: string;
  checklistAtivo: boolean;
  nomeDe: (usuarioId: string | null) => string;
  recebidos: ChecklistEnvio[];
  lotes: LoteEnvio[];
  tickets: Ticket[];
  novidades: Set<string>;
};

const depoisDe = (iso: string | null | undefined, desde: number) => Boolean(iso) && new Date(iso!).getTime() > desde;

/** a) Recebidas ainda pendentes, criadas ou reenviadas depois do "desde". */
function recebidas(f: Fontes, desde: number): EntradaResumo[] {
  return f.recebidos
    .filter((e) => depoisDe(ultimoEnvioEm(e), desde))
    .map((e) => ({
      chave: chaveEnvio(e.id),
      tipo: "recebida",
      frase: `${f.nomeDe(e.de_usuario_id)} te enviou "${e.titulo}"`,
      envioId: e.id,
    }));
}

/**
 * b) e c) Respostas aos meus envios, por lote: aceitos e lotes recusados por todos ainda sem ciência.
 * As respondidas depois do "desde" sem ciência são um caso destas; as que já têm ciência foram vistas.
 */
function respostas(f: Fontes): EntradaResumo[] {
  return f.lotes.flatMap((l): EntradaResumo[] => {
    if (l.ciente) return [];
    if (l.status === "aceito") {
      return [{ chave: chaveLote(l.id), tipo: "aceita", frase: `${f.nomeDe(l.aceito!.para_usuario_id)} aceitou "${l.titulo}"`, loteId: l.id }];
    }
    if (l.status === "recusado") {
      const quem = paraUmaPessoa(l) ? `${f.nomeDe(l.envios[0].para_usuario_id)} recusou` : "Todos recusaram";
      return [
        { chave: chaveLote(l.id), tipo: "recusada", frase: `${quem} "${l.titulo}"`, loteId: l.id, itemId: l.itemId ?? undefined },
      ];
    }
    return [];
  });
}

/** d) Listas compartilhadas comigo depois do "desde". */
async function listas(f: Fontes, desde: number): Promise<EntradaResumo[]> {
  const novas = (await listarParticipacoes(f.usuarioId)).filter((m) => depoisDe(m.adicionado_em, desde));
  if (novas.length === 0) return [];
  const grupos = await listarGruposPorIds(novas.map((m) => m.grupo_id));
  return grupos.map((g) => ({
    chave: chaveLista(g.id),
    tipo: "lista",
    frase: `${f.nomeDe(g.dono_id)} compartilhou a lista "${g.nome}"`,
  }));
}

/** e) Tickets com novidade não lida (mesma regra do lembrete de pendências). */
function tickets(f: Fontes): EntradaResumo[] {
  return f.tickets
    .filter((t) => f.novidades.has(t.id))
    .map((t) => ({
      chave: chaveTicket(t.id),
      tipo: "ticket",
      frase: `Novidade no ticket #${t.numero} ${t.titulo}`,
      ticketId: t.id,
      ticketNumero: t.numero,
    }));
}

/** Notificações do admin ficam fora: já aparecem pelo próprio sistema delas. */
export async function montarResumo(f: Fontes): Promise<EntradaResumo[]> {
  const desde = new Date(f.desde).getTime();
  const doChecklist = f.checklistAtivo
    ? [...recebidas(f, desde), ...respostas(f), ...(await listas(f, desde).catch(() => []))]
    : [];
  return [...doChecklist, ...tickets(f)];
}
