import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { PERMISSOES_DISPONIVEIS, permissoesVazias, type PermissoesMarcadas } from "@/lib/permissoes";
import { nomeExibicao, type UsuarioLista } from "./usuarios";
import type { Setor, Ticket } from "@/lib/types/shell";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function salvarSetoresUsuario(usuario: UsuarioLista, novosIds: string[], setores: Setor[]) {
  const antes = new Set(usuario.setores_ids);
  const depois = new Set(novosIds);
  const removidos = [...antes].filter((id) => !depois.has(id));
  const adicionados = [...depois].filter((id) => !antes.has(id));
  if (removidos.length === 0 && adicionados.length === 0) return false;

  if (removidos.length > 0) {
    const { error } = await supabase
      .from("usuario_setores")
      .delete()
      .eq("usuario_id", usuario.id)
      .in("setor_id", removidos);
    falhar(error);
  }
  if (adicionados.length > 0) {
    const { error } = await supabase
      .from("usuario_setores")
      .insert(adicionados.map((setor_id) => ({ usuario_id: usuario.id, setor_id })));
    falhar(error);
  }

  const nomeSetor = (id: string) => setores.find((s) => s.id === id)?.nome ?? id;
  await registrarAcao({
    acao: "alterar_setores_usuario",
    alvo_tipo: "usuario",
    alvo_id: usuario.id,
    descricao: `alterou os setores do usuário ${nomeExibicao(usuario)}`,
    dados: { adicionados: adicionados.map(nomeSetor), removidos: removidos.map(nomeSetor) },
  });
  return true;
}

export async function carregarPermissoesUsuario(userId: string): Promise<PermissoesMarcadas> {
  const { data, error } = await supabase.from("permissoes").select("modulo, item").eq("user_id", userId);
  falhar(error);

  const marcadas = permissoesVazias();
  for (const p of PERMISSOES_DISPONIVEIS) {
    marcadas[p.key] = (data ?? []).some((d) => d.modulo === p.modulo && d.item === p.item);
  }
  return marcadas;
}

/** Mesma lógica da versão anterior do admin: apaga tudo do usuário e insere o que estiver marcado. */
export async function salvarPermissoesUsuario(usuario: UsuarioLista, marcadas: PermissoesMarcadas) {
  const { error: deleteError } = await supabase.from("permissoes").delete().eq("user_id", usuario.id);
  falhar(deleteError);

  const selecionadas = PERMISSOES_DISPONIVEIS.filter((p) => marcadas[p.key]).map((p) => ({
    user_id: usuario.id,
    modulo: p.modulo,
    item: p.item,
    nome_usuario: usuario.nome,
  }));

  if (selecionadas.length > 0) {
    const { error: insertError } = await supabase.from("permissoes").insert(selecionadas);
    falhar(insertError);
  }

  await registrarAcao({
    acao: "alterar_permissoes_usuario",
    alvo_tipo: "usuario",
    alvo_id: usuario.id,
    descricao: `alterou as permissões do usuário ${nomeExibicao(usuario)}`,
    dados: { permissoes: selecionadas.map((p) => `${p.modulo}.${p.item}`) },
  });
}

export async function buscarSenhaUsuario(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("usuarios").select("senha").eq("id", userId).single();
  falhar(error);
  return data?.senha ?? null;
}

export type TicketResumo = Pick<Ticket, "id" | "numero" | "titulo" | "status" | "criado_em">;

export async function carregarTicketsUsuario(userId: string) {
  const colunas = "id, numero, titulo, status, criado_em";
  const [abertosRes, destinadosRes] = await Promise.all([
    supabase
      .from("tickets")
      .select(colunas)
      .eq("autor_id", userId)
      .is("excluido_em", null)
      .order("criado_em", { ascending: false })
      .limit(50),
    supabase
      .from("tickets")
      .select(colunas)
      .eq("destino_usuario_id", userId)
      .is("excluido_em", null)
      .order("criado_em", { ascending: false })
      .limit(50),
  ]);
  falhar(abertosRes.error);
  falhar(destinadosRes.error);

  return {
    abertos: (abertosRes.data ?? []) as TicketResumo[],
    destinados: (destinadosRes.data ?? []) as TicketResumo[],
  };
}
