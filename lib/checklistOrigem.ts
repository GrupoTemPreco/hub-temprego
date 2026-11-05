import { formatarDataSP, formatarDiaMesSP } from "@/lib/datas";

export type OrigemRecebida = { nome: string; em: string };

/** Campos extras devolvidos pela RPC do RH (e opcionais no restante da UI). */
export type CamposOrigem = {
  recebida_de_nome?: string | null;
  recebida_em?: string | null;
};

type LinhaOrigem = {
  de_usuario_id: string;
  respondido_em: string | null;
};

export function primeiroNome(nome: string | null | undefined) {
  const n = nome?.trim();
  if (!n) return "Alguém";
  return n.split(/\s+/)[0];
}

export function textoRecebidaLista(origem: OrigemRecebida) {
  return `Recebida de ${primeiroNome(origem.nome)} · ${formatarDiaMesSP(origem.em)}`;
}

export function textoRecebidaTarefa(origem: OrigemRecebida) {
  return `Recebida de ${primeiroNome(origem.nome)} em ${formatarDataSP(origem.em)}`;
}

export function origemDosCampos(nome?: string | null, em?: string | null): OrigemRecebida | null {
  if (!em) return null;
  return { nome: nome || "Alguém", em };
}

/** Cópia do modo "todos" tem prioridade; senão a original transferida. Mais antigo primeiro. */
export function registrarOrigem(
  mapa: Map<string, OrigemRecebida>,
  chave: string | null | undefined,
  linha: LinhaOrigem,
  nomeDe: (id: string | null) => string,
) {
  if (!chave || !linha.respondido_em) return mapa;
  const atual = mapa.get(chave);
  if (atual && atual.em <= linha.respondido_em) return mapa;
  const proximo = new Map(mapa);
  proximo.set(chave, { nome: nomeDe(linha.de_usuario_id), em: linha.respondido_em });
  return proximo;
}

export function mapaOrigens<T extends LinhaOrigem>(
  linhas: T[],
  chaveDe: (linha: T) => string | null | undefined,
  nomeDe: (id: string | null) => string,
) {
  let mapa = new Map<string, OrigemRecebida>();
  for (const linha of linhas) mapa = registrarOrigem(mapa, chaveDe(linha), linha, nomeDe);
  return mapa;
}
