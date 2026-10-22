import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { rotuloStatus } from "@/lib/format";
import type { Setor, Usuario, UsuarioStatus } from "@/lib/types/shell";

export type UsuarioLista = Omit<Usuario, "senha"> & { setores_ids: string[] };

export type DadosUsuarioEditaveis = Pick<Usuario, "nome" | "email" | "status" | "is_admin" | "recebe_tickets">;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function nomeExibicao(u: Pick<Usuario, "nome" | "email">) {
  return u.nome || u.email || "usuário sem nome";
}

export async function listarUsuariosESetores(): Promise<{ usuarios: UsuarioLista[]; setores: Setor[] }> {
  const [usuariosRes, vinculosRes, setoresRes] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nome, email, status, is_admin, recebe_tickets")
      .order("nome", { ascending: true }),
    supabase.from("usuario_setores").select("usuario_id, setor_id"),
    supabase.from("setores").select("*").order("nome", { ascending: true }),
  ]);
  falhar(usuariosRes.error);
  falhar(vinculosRes.error);
  falhar(setoresRes.error);

  const setoresPorUsuario = new Map<string, string[]>();
  for (const v of vinculosRes.data ?? []) {
    setoresPorUsuario.set(v.usuario_id, [...(setoresPorUsuario.get(v.usuario_id) ?? []), v.setor_id]);
  }

  const usuarios = (usuariosRes.data ?? []).map((u) => ({
    ...(u as Omit<Usuario, "senha">),
    setores_ids: setoresPorUsuario.get(u.id) ?? [],
  }));

  return { usuarios, setores: (setoresRes.data ?? []) as Setor[] };
}

export async function alterarStatusUsuario(usuario: UsuarioLista, status: Extract<UsuarioStatus, "aprovado" | "rejeitado">) {
  const { error } = await supabase.from("usuarios").update({ status }).eq("id", usuario.id);
  falhar(error);

  const verbo = status === "aprovado" ? "aprovou" : "rejeitou";
  await registrarAcao({
    acao: status === "aprovado" ? "aprovar_usuario" : "rejeitar_usuario",
    alvo_tipo: "usuario",
    alvo_id: usuario.id,
    descricao: `${verbo} o usuário ${nomeExibicao(usuario)}`,
    dados: { status_anterior: usuario.status, status_novo: status },
  });
}

/** Salva só o que mudou e registra uma ação no log para cada tipo de alteração. */
export async function salvarDadosUsuario(antes: UsuarioLista, depois: DadosUsuarioEditaveis) {
  const mudou = (campo: keyof DadosUsuarioEditaveis) => antes[campo] !== depois[campo];
  if (!(["nome", "email", "status", "is_admin", "recebe_tickets"] as const).some(mudou)) return false;

  const { error } = await supabase.from("usuarios").update(depois).eq("id", antes.id);
  falhar(error);

  const nome = nomeExibicao(depois);
  const base = { alvo_tipo: "usuario", alvo_id: antes.id };
  const logs: Promise<void>[] = [];

  if (mudou("nome") || mudou("email")) {
    logs.push(
      registrarAcao({
        ...base,
        acao: "editar_dados_usuario",
        descricao: `editou os dados do usuário ${nome}`,
        dados: { antes: { nome: antes.nome, email: antes.email }, depois: { nome: depois.nome, email: depois.email } },
      }),
    );
  }
  if (mudou("status")) {
    logs.push(
      registrarAcao({
        ...base,
        acao: "alterar_status_usuario",
        descricao: `alterou o status do usuário ${nome} para "${rotuloStatus(depois.status)}"`,
        dados: { status_anterior: antes.status, status_novo: depois.status },
      }),
    );
  }
  if (mudou("is_admin")) {
    logs.push(
      registrarAcao({
        ...base,
        acao: "alterar_admin",
        descricao: depois.is_admin
          ? `concedeu acesso de administrador a ${nome}`
          : `removeu o acesso de administrador de ${nome}`,
        dados: { is_admin: depois.is_admin },
      }),
    );
  }
  if (mudou("recebe_tickets")) {
    logs.push(
      registrarAcao({
        ...base,
        acao: "alterar_recebe_tickets",
        descricao: depois.recebe_tickets
          ? `ativou o recebimento de tickets para ${nome}`
          : `desativou o recebimento de tickets para ${nome}`,
        dados: { recebe_tickets: depois.recebe_tickets },
      }),
    );
  }

  await Promise.all(logs);
  return true;
}
