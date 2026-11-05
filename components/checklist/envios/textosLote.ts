import type { BadgeVariant } from "@/components/ui/Badge";
import type { ProgressoEnvioLote } from "@/lib/checklistEnvios";
import type { ProgressoEnvioListaLote } from "@/lib/checklistEnviosLista";
import type { EnvioDoLote, LoteDe, LoteEnvio } from "@/lib/checklistLotes";
import type { ChecklistEnvio, ChecklistEnvioStatus } from "@/lib/types/shell";

export type Nomes = { nomeDe: (usuarioId: string | null) => string; nomeSetor: (setorId: string | null) => string };

/** Lote de tarefa ou de lista. */
type Lote = LoteDe<EnvioDoLote>;

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

/** "Ana", "Ana, Bruno +2" ou "Financeiro (5)". */
export function destinoDoLote(lote: Lote, { nomeDe, nomeSetor }: Nomes) {
  if (lote.setorId) return `${nomeSetor(lote.setorId)} (${lote.envios.length})`;
  const nomes = lote.envios.map((e) => primeiroNome(nomeDe(e.para_usuario_id)));
  if (nomes.length <= 2) return nomes.join(", ");
  return `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
}

/** Era para uma pessoa só (diretamente ou por um setor de um membro). */
export const paraUmaPessoa = (lote: Lote) => lote.envios.length === 1;

export function rotuloRecusa(lote: Lote, { nomeDe }: Pick<Nomes, "nomeDe">) {
  return paraUmaPessoa(lote) ? `Recusada por ${nomeDe(lote.envios[0].para_usuario_id)}` : "Recusada por todos";
}

/** "Ana: sem tempo esta semana" para cada recusa. */
export function motivosRecusa(lote: Lote, { nomeDe }: Pick<Nomes, "nomeDe">) {
  return lote.recusados.map((e) => `${primeiroNome(nomeDe(e.para_usuario_id))}: ${e.resposta || "sem motivo"}`);
}

export function statusGeral(
  lote: LoteEnvio,
  nomes: Nomes,
  progresso: ProgressoEnvioLote[] = [],
): { texto: string; cor: BadgeVariant } {
  if (lote.modo === "todos") {
    return { texto: rotuloProgressoTodos(lote, progresso), cor: "info" };
  }
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

export function destinatariosAtivos(lote: Pick<LoteDe<EnvioDoLote>, "envios">) {
  return lote.envios.filter((e) => e.status !== "cancelado");
}

export function qtdConcluidas(progresso: ProgressoEnvioLote[]) {
  return progresso.filter((p) => p.copia_status === "feito").length;
}

/** "Enviada a 4 · 2 concluíram". */
export function rotuloProgressoTodos(lote: Pick<LoteDe<EnvioDoLote>, "envios">, progresso: ProgressoEnvioLote[]) {
  const n = destinatariosAtivos(lote).length || lote.envios.length;
  const k = qtdConcluidas(progresso);
  return `Enviada a ${n} · ${k} ${k === 1 ? "concluiu" : "concluíram"}`;
}

function diaMes(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** "aguardando", "recusou", "fazendo", "concluiu em dd/mm". */
export function situacaoPessoaTodos(
  envio: Pick<ChecklistEnvio, "id" | "status" | "resposta">,
  progresso: ProgressoEnvioLote[] = [],
) {
  if (envio.status === "pendente") return "aguardando";
  if (envio.status === "recusado") return envio.resposta ? `recusou — ${envio.resposta}` : "recusou";
  if (envio.status === "cancelado") return "cancelado";
  const linha = progresso.find((p) => p.envio_id === envio.id);
  if (linha?.copia_status === "feito") {
    return linha.copia_concluido_em ? `concluiu em ${diaMes(linha.copia_concluido_em)}` : "concluiu";
  }
  if (envio.status === "aceito") return "fazendo";
  return STATUS_DESTINATARIO[envio.status]?.texto ?? envio.status;
}

export const STATUS_DESTINATARIO: Record<ChecklistEnvioStatus, { texto: string; cor: BadgeVariant }> = {
  pendente: { texto: "Aguardando", cor: "warning" },
  aceito: { texto: "Aceitou", cor: "success" },
  recusado: { texto: "Recusou", cor: "danger" },
  cancelado: { texto: "Cancelado", cor: "neutral" },
  encerrado: { texto: "Outra pessoa aceitou", cor: "neutral" },
};

/** "Enviada a 4 · 2 aceitaram". */
export function rotuloProgressoListaTodos(lote: Pick<LoteDe<EnvioDoLote>, "envios">) {
  const n = destinatariosAtivos(lote).length || lote.envios.length;
  const k = lote.envios.filter((e) => e.status === "aceito").length;
  return `Enviada a ${n} · ${k} ${k === 1 ? "aceitou" : "aceitaram"}`;
}

/** "aguardando", "recusou", "3/8 feitas" ou "recorrente". */
export function situacaoPessoaListaTodos(
  envio: Pick<ChecklistEnvio, "id" | "status" | "resposta">,
  progresso: ProgressoEnvioListaLote[] = [],
) {
  if (envio.status === "pendente") return "aguardando";
  if (envio.status === "recusado") return envio.resposta ? `recusou — ${envio.resposta}` : "recusou";
  if (envio.status === "cancelado") return "cancelado";
  const linha = progresso.find((p) => p.envio_id === envio.id);
  if (envio.status === "aceito") {
    if (linha?.copia_recorrente) return "recorrente";
    if (linha?.copia_total != null) return `${linha.copia_feitas ?? 0}/${linha.copia_total} feitas`;
    return "aceitou";
  }
  return STATUS_DESTINATARIO[envio.status]?.texto ?? envio.status;
}

/** "1 tarefa" / "8 tarefas". */
export const textoTarefas = (n: number) => (n === 1 ? "1 tarefa" : `${n} tarefas`);
