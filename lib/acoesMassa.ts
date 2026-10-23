export type FalhaMassa = { id: string; rotulo: string; erro: string };

export type ResultadoMassa = { total: number; ok: string[]; falhas: FalhaMassa[] };

const CONCORRENCIA = 8;
const MAX_NOMES_NO_TOAST = 5;

export function erroTexto(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

/** "1 usuário", "10 usuários" */
export function quantidade(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Roda `acao` em cada item, alguns por vez; um erro não interrompe os demais. */
export async function executarEmLote<T>(
  itens: T[],
  idDe: (item: T) => string,
  rotuloDe: (item: T) => string,
  acao: (item: T) => Promise<void>,
): Promise<ResultadoMassa> {
  const resultado: ResultadoMassa = { total: itens.length, ok: [], falhas: [] };
  for (let i = 0; i < itens.length; i += CONCORRENCIA) {
    const lote = itens.slice(i, i + CONCORRENCIA);
    const respostas = await Promise.allSettled(lote.map(acao));
    respostas.forEach((r, j) => {
      const item = lote[j];
      if (r.status === "fulfilled") resultado.ok.push(idDe(item));
      else resultado.falhas.push({ id: idDe(item), rotulo: rotuloDe(item), erro: erroTexto(r.reason) });
    });
  }
  return resultado;
}

/** Texto do toast: sucesso total, ou quantos deram certo e quais falharam. */
export function resumoResultado(r: ResultadoMassa, sucesso: (n: number) => string) {
  if (r.falhas.length === 0) return { ok: true, texto: sucesso(r.ok.length) };
  const nomes = r.falhas.slice(0, MAX_NOMES_NO_TOAST).map((f) => f.rotulo);
  const resto = r.falhas.length - nomes.length;
  const lista = `${nomes.join(", ")}${resto > 0 ? ` e mais ${resto}` : ""}`;
  const erro = r.falhas[0].erro;
  return { ok: false, texto: `${r.ok.length} de ${r.total} deram certo. Falharam: ${lista} (${erro}).` };
}

/** Para o registrarAcao: ids alterados e as falhas, sem texto de erro repetido. */
export function dadosDoLog(r: ResultadoMassa, extras: Record<string, unknown> = {}) {
  return { ...extras, ids: r.ok, falhas: r.falhas.map((f) => ({ id: f.id, erro: f.erro })) };
}
