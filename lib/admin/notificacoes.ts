import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { exigeConfirmacao, usuariosDoPublico } from "@/lib/notificacoes";
import type { Notificacao, NotificacaoLeitura, Setor, Usuario, UsuarioSetor } from "@/lib/types/shell";

export type UsuarioNotificacao = Pick<Usuario, "id" | "nome" | "email" | "status">;

export type DadosNotificacoes = {
  notificacoes: Notificacao[];
  leituras: NotificacaoLeitura[];
  usuarios: UsuarioNotificacao[];
  setores: Pick<Setor, "id" | "nome" | "ativo">[];
  vinculos: UsuarioSetor[];
};

export type NotificacaoPayload = Omit<Notificacao, "id" | "criado_por" | "criado_em" | "atualizado_em">;

const CHECK_VIOLATION = "23514";

function falhar(error: { code?: string; message: string } | null) {
  if (error?.code === CHECK_VIOLATION) {
    throw new Error("O banco recusou os dados: confira o público escolhido e se o fim é depois do início.");
  }
  if (error) throw new Error(error.message);
}

export async function carregarDadosNotificacoes(): Promise<DadosNotificacoes> {
  const [n, l, u, s, v] = await Promise.all([
    supabase.from("notificacoes").select("*").order("inicio_em", { ascending: false }),
    supabase.from("notificacao_leituras").select("*"),
    supabase.from("usuarios").select("id, nome, email, status").order("nome", { ascending: true }),
    supabase.from("setores").select("id, nome, ativo").order("nome", { ascending: true }),
    supabase.from("usuario_setores").select("usuario_id, setor_id"),
  ]);
  [n, l, u, s, v].forEach((r) => falhar(r.error));
  return {
    notificacoes: (n.data ?? []) as Notificacao[],
    leituras: (l.data ?? []) as NotificacaoLeitura[],
    usuarios: (u.data ?? []) as UsuarioNotificacao[],
    setores: (s.data ?? []) as DadosNotificacoes["setores"],
    vinculos: (v.data ?? []) as UsuarioSetor[],
  };
}

export type LeituraUsuario = { usuario: UsuarioNotificacao; leitura: NotificacaoLeitura | undefined };

/** Público da notificação com a leitura de cada pessoa e os totais (para janela, conta confirmações). */
export function estatisticaLeitura(n: Notificacao, dados: DadosNotificacoes) {
  const publico = usuariosDoPublico(n, dados.usuarios, dados.vinculos);
  const leituras = new Map(
    dados.leituras.filter((l) => l.notificacao_id === n.id).map((l) => [l.usuario_id, l]),
  );
  const linhas: LeituraUsuario[] = publico.map((usuario) => ({ usuario, leitura: leituras.get(usuario.id) }));
  const vistos = linhas.filter((l) => l.leitura?.visto_em).length;
  const confirmados = linhas.filter((l) => l.leitura?.confirmado_em).length;
  return {
    linhas,
    total: publico.length,
    vistos,
    confirmados,
    lidos: exigeConfirmacao(n.formato) ? confirmados : vistos,
  };
}

const log = (acao: string, id: string, descricao: string, dados?: Record<string, unknown>) =>
  registrarAcao({ acao, alvo_tipo: "notificacao", alvo_id: id, descricao, dados });

/** Cria uma notificação. Se `original` for informada, registra como duplicação. */
export async function criarNotificacao(payload: NotificacaoPayload, autorId: string, original?: Notificacao) {
  const { data, error } = await supabase
    .from("notificacoes")
    .insert({ ...payload, criado_por: autorId })
    .select("id")
    .single();
  falhar(error);
  const id = data!.id as string;

  if (original) {
    await log("duplicar_notificacao", id, `duplicou a notificação "${original.titulo}" como "${payload.titulo}"`, {
      original_id: original.id,
    });
  } else {
    await log("criar_notificacao", id, `criou a notificação "${payload.titulo}"`);
  }
}

export async function editarNotificacao(antes: Notificacao, payload: NotificacaoPayload) {
  const { error } = await supabase
    .from("notificacoes")
    .update({ ...payload, atualizado_em: new Date().toISOString() })
    .eq("id", antes.id);
  falhar(error);
  await log("editar_notificacao", antes.id, `editou a notificação "${payload.titulo}"`, {
    antes: { titulo: antes.titulo, inicio_em: antes.inicio_em, fim_em: antes.fim_em, ativa: antes.ativa },
  });
}

export async function alterarAtivaNotificacao(n: Notificacao, ativa: boolean) {
  const { error } = await supabase
    .from("notificacoes")
    .update({ ativa, atualizado_em: new Date().toISOString() })
    .eq("id", n.id);
  falhar(error);
  await log(
    ativa ? "reativar_notificacao" : "encerrar_notificacao",
    n.id,
    `${ativa ? "reativou" : "encerrou"} a notificação "${n.titulo}"`,
  );
}

export async function excluirNotificacao(n: Notificacao) {
  const { error } = await supabase.from("notificacoes").delete().eq("id", n.id);
  falhar(error);
  await log("excluir_notificacao", n.id, `excluiu a notificação "${n.titulo}"`);
}
