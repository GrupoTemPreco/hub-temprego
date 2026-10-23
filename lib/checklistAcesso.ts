import type { ChecklistGrupo, ChecklistMembro } from "@/lib/types/shell";

export type AcessoGrupo = {
  /** Só o dono renomeia, troca a cor, arquiva e compartilha. */
  dono: boolean;
  donoId: string;
  /** Dono ou membro com pode_editar: cria, edita, conclui, exclui, envia e arrasta itens. */
  podeEditar: boolean;
  /** Tem membros: os itens são vistos por mais gente. */
  compartilhado: boolean;
  /** Membros do grupo (sem o dono), na ordem em que foram adicionados. */
  membros: ChecklistMembro[];
};

const SEM_ACESSO: AcessoGrupo = { dono: false, donoId: "", podeEditar: false, compartilhado: false, membros: [] };

export function membrosPorGrupo(membros: ChecklistMembro[]) {
  const mapa = new Map<string, ChecklistMembro[]>();
  for (const m of [...membros].sort((a, b) => a.adicionado_em.localeCompare(b.adicionado_em))) {
    mapa.set(m.grupo_id, [...(mapa.get(m.grupo_id) ?? []), m]);
  }
  return mapa;
}

export function calcularAcesso(grupo: ChecklistGrupo | undefined, membros: ChecklistMembro[], meuId: string): AcessoGrupo {
  if (!grupo) return SEM_ACESSO;
  const dono = grupo.dono_id === meuId;
  const meu = membros.find((m) => m.usuario_id === meuId);
  return {
    dono,
    donoId: grupo.dono_id,
    podeEditar: dono || Boolean(meu?.pode_editar),
    compartilhado: membros.length > 0,
    membros,
  };
}

/**
 * Grade do usuário: os grupos próprios pela ordem de checklist_grupos e os compartilhados pela
 * ordem dele em checklist_grupo_membros. Compartilhados ainda sem ordem vão para o fim.
 * O `ordem` devolvido é o da grade (é sobre ele que o arrasto calcula a posição nova).
 */
export function gruposNaOrdemDaGrade(grupos: ChecklistGrupo[], membros: ChecklistMembro[], meuId: string) {
  const minhas = new Map(membros.filter((m) => m.usuario_id === meuId).map((m) => [m.grupo_id, m]));
  const ordensConhecidas = grupos.map((g) => (g.dono_id === meuId ? g.ordem : minhas.get(g.id)?.ordem ?? 0));
  const base = Math.max(0, ...ordensConhecidas);
  const semOrdem = grupos
    .filter((g) => g.dono_id !== meuId && minhas.get(g.id)?.ordem == null)
    .sort((a, b) => (minhas.get(a.id)?.adicionado_em ?? "").localeCompare(minhas.get(b.id)?.adicionado_em ?? ""));
  const fimDaGrade = new Map(semOrdem.map((g, i) => [g.id, base + 1 + i]));

  return grupos
    .map((g) => (g.dono_id === meuId ? g : { ...g, ordem: minhas.get(g.id)?.ordem ?? fimDaGrade.get(g.id)! }))
    .sort((a, b) => a.ordem - b.ordem);
}
