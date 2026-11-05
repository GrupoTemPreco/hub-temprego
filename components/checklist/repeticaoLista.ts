import type { Dispatch, SetStateAction } from "react";
import { atualizarGrupo } from "@/lib/checklist";
import {
  camposDaLista,
  conclusaoAoReprogramar,
  desligarItensDaLista,
  feitaNaOcorrencia,
  ligarItensDaLista,
  marcarConclusoes,
  mesmosDias,
  normalizarDias,
  type LinhaConclusao,
} from "@/lib/checklistDiarias";
import { hojeSP } from "@/lib/checklistRegras";
import type { ChecklistGrupo, ChecklistItem } from "@/lib/types/shell";
import type { useConclusoesHoje } from "./useConclusoesHoje";

/** Não repete: diaria false. Repete: todo dia (null) ou os dias escolhidos. */
export type NovaRepeticaoLista = Pick<ChecklistGrupo, "diaria" | "dias_semana">;

type Deps = {
  usuarioId: string;
  grupos: ChecklistGrupo[];
  itens: ChecklistItem[];
  conclusoes: ReturnType<typeof useConclusoesHoje>;
  setGrupos: Dispatch<SetStateAction<ChecklistGrupo[]>>;
  setItens: Dispatch<SetStateAction<ChecklistItem[]>>;
};

/**
 * Liga, troca os dias ou desliga a repetição da lista inteira (as tarefas ficam com os dias da lista).
 * Concluída hoje continua feita (conclusão na nova ocorrência atual). Desligar aplica a regra do dia.
 */
export async function aplicarRepeticaoLista(deps: Deps, grupoId: string, nova: NovaRepeticaoLista) {
  const { usuarioId, grupos, itens, conclusoes, setGrupos, setItens } = deps;
  const grupo = grupos.find((g) => g.id === grupoId);
  const lista = { diaria: nova.diaria, dias_semana: nova.diaria ? normalizarDias(nova.dias_semana) : null };
  if (!grupo || (grupo.diaria === lista.diaria && mesmosDias(grupo.dias_semana, lista.dias_semana))) return;

  const antesItens = itens.filter((i) => i.grupo_id === grupoId);
  const hoje = hojeSP();
  const feitas = antesItens.filter((i) => feitaNaOcorrencia(i, conclusoes.conclusoes, hoje)).map((i) => i.id);
  const feitasSet = new Set(feitas);
  const daLista = lista.diaria ? camposDaLista(lista) : null;
  const novasConclusoes: LinhaConclusao[] = daLista
    ? antesItens.flatMap((i) => {
        const linha = conclusaoAoReprogramar(i, { ...i, ...daLista }, conclusoes.conclusoes, hoje);
        return linha ? [linha] : [];
      })
    : [];

  setGrupos((prev) => prev.map((g) => (g.id === grupoId ? { ...g, ...lista } : g)));
  setItens((prev) =>
    prev.map((i) => {
      if (i.grupo_id !== grupoId) return i;
      if (daLista) return { ...i, ...daLista };
      return { ...i, diaria: false, dias_semana: null, status: feitasSet.has(i.id) ? "feito" : "a_fazer" };
    }),
  );
  conclusoes.incluir(novasConclusoes);
  try {
    if (daLista) {
      await ligarItensDaLista(grupoId, lista);
      await marcarConclusoes(novasConclusoes, usuarioId);
    } else await desligarItensDaLista(grupoId, feitas);
    await atualizarGrupo(grupoId, lista);
  } catch (err) {
    conclusoes.retirar(novasConclusoes);
    setGrupos((prev) => prev.map((g) => (g.id === grupoId ? grupo : g)));
    const porId = new Map(antesItens.map((i) => [i.id, i]));
    setItens((prev) => prev.map((i) => porId.get(i.id) ?? i));
    throw err;
  }
}
