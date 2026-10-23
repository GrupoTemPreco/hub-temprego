import { supabase } from "@/lib/supabase";
import type { ChecklistMembro } from "@/lib/types/shell";

const COLUNAS = "grupo_id, usuario_id, pode_editar, adicionado_em, ordem";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const nomeCanal = (prefixo: string) => `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function listarMembros(grupoIds: string[]): Promise<ChecklistMembro[]> {
  if (grupoIds.length === 0) return [];
  const { data, error } = await supabase.from("checklist_grupo_membros").select(COLUNAS).in("grupo_id", grupoIds);
  falhar(error);
  return (data ?? []) as ChecklistMembro[];
}

/** Grupos compartilhados com o usuário (as linhas em que ele é o membro). */
export async function listarParticipacoes(usuarioId: string): Promise<ChecklistMembro[]> {
  const { data, error } = await supabase.from("checklist_grupo_membros").select(COLUNAS).eq("usuario_id", usuarioId);
  falhar(error);
  return (data ?? []) as ChecklistMembro[];
}

export async function adicionarMembro(grupoId: string, usuarioId: string, podeEditar: boolean) {
  const { data, error } = await supabase
    .from("checklist_grupo_membros")
    .insert({ grupo_id: grupoId, usuario_id: usuarioId, pode_editar: podeEditar })
    .select(COLUNAS)
    .single();
  falhar(error);
  return data as ChecklistMembro;
}

export async function alterarMembro(
  grupoId: string,
  usuarioId: string,
  campos: Partial<Pick<ChecklistMembro, "pode_editar" | "ordem">>,
) {
  const { error } = await supabase
    .from("checklist_grupo_membros")
    .update(campos)
    .eq("grupo_id", grupoId)
    .eq("usuario_id", usuarioId);
  falhar(error);
}

/** Remover um membro (dono) ou sair do grupo (o próprio membro). */
export async function removerMembro(grupoId: string, usuarioId: string) {
  const { error } = await supabase
    .from("checklist_grupo_membros")
    .delete()
    .eq("grupo_id", grupoId)
    .eq("usuario_id", usuarioId);
  falhar(error);
}

export type OuvintesParticipacao = {
  /** Linha nova ou alterada em que o usuário é o membro. */
  mudou: (membro: ChecklistMembro, tipo: "INSERT" | "UPDATE") => void;
  /** Linha apagada; `grupoId`/`usuarioId` vêm da chave primária quando o banco os envia. */
  removido: (grupoId: string | null, usuarioId: string | null) => void;
};

/**
 * Assina checklist_grupo_membros com usuario_id = eu. O Realtime não filtra DELETE,
 * então a remoção vem por uma segunda assinatura, sem filtro, e quem chama confere o usuário.
 */
export function assinarParticipacoes(usuarioId: string, ouvintes: OuvintesParticipacao) {
  const tabela = { schema: "shell", table: "checklist_grupo_membros" } as const;
  const canal = supabase
    .channel(nomeCanal(`checklist-membros-${usuarioId}`))
    .on("postgres_changes", { ...tabela, event: "INSERT", filter: `usuario_id=eq.${usuarioId}` }, (p) =>
      ouvintes.mudou(p.new as ChecklistMembro, "INSERT"),
    )
    .on("postgres_changes", { ...tabela, event: "UPDATE", filter: `usuario_id=eq.${usuarioId}` }, (p) =>
      ouvintes.mudou(p.new as ChecklistMembro, "UPDATE"),
    )
    .on("postgres_changes", { ...tabela, event: "DELETE" }, (p) => {
      const antigo = (p.old ?? {}) as Partial<ChecklistMembro>;
      ouvintes.removido(antigo.grupo_id ?? null, antigo.usuario_id ?? null);
    })
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}
