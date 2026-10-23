import type { BadgeVariant } from "@/components/ui/Badge";
import type { LoteEnvio } from "@/lib/checklistLotes";
import type { ChecklistEnvioStatus } from "@/lib/types/shell";

export type Nomes = { nomeDe: (usuarioId: string | null) => string; nomeSetor: (setorId: string | null) => string };

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

/** "Ana", "Ana, Bruno +2" ou "Financeiro (5)". */
export function destinoDoLote(lote: LoteEnvio, { nomeDe, nomeSetor }: Nomes) {
  if (lote.setorId) return `${nomeSetor(lote.setorId)} (${lote.envios.length})`;
  const nomes = lote.envios.map((e) => primeiroNome(nomeDe(e.para_usuario_id)));
  if (nomes.length <= 2) return nomes.join(", ");
  return `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
}

/** Era para uma pessoa só (diretamente ou por um setor de um membro). */
export const paraUmaPessoa = (lote: LoteEnvio) => lote.envios.length === 1;

export function rotuloRecusa(lote: LoteEnvio, { nomeDe }: Pick<Nomes, "nomeDe">) {
  return paraUmaPessoa(lote) ? `Recusada por ${nomeDe(lote.envios[0].para_usuario_id)}` : "Recusada por todos";
}

/** "Ana: sem tempo esta semana" para cada recusa. */
export function motivosRecusa(lote: LoteEnvio, { nomeDe }: Pick<Nomes, "nomeDe">) {
  return lote.recusados.map((e) => `${primeiroNome(nomeDe(e.para_usuario_id))}: ${e.resposta || "sem motivo"}`);
}

export function statusGeral(lote: LoteEnvio, nomes: Nomes): { texto: string; cor: BadgeVariant } {
  switch (lote.status) {
    case "aguardando":
      return { texto: "Aguardando", cor: "warning" };
    case "aceito":
      return { texto: `Aceita por ${primeiroNome(nomes.nomeDe(lote.aceito!.para_usuario_id))}`, cor: "success" };
    case "recusado":
      return { texto: rotuloRecusa(lote, nomes), cor: "danger" };
    case "cancelado":
      return { texto: "Cancelada", cor: "neutral" };
  }
}

export const STATUS_DESTINATARIO: Record<ChecklistEnvioStatus, { texto: string; cor: BadgeVariant }> = {
  pendente: { texto: "Aguardando", cor: "warning" },
  aceito: { texto: "Aceitou", cor: "success" },
  recusado: { texto: "Recusou", cor: "danger" },
  cancelado: { texto: "Cancelado", cor: "neutral" },
  encerrado: { texto: "Outra pessoa aceitou", cor: "neutral" },
};
