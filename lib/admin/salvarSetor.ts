import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import type { SetorLista, UsuarioOpcao } from "./setores";

export type SetorForm = {
  nome: string;
  descricao: string | null;
  ativo: boolean;
  responsavel_id: string | null;
  membros_ids: string[];
};

export class NomeSetorDuplicadoError extends Error {
  constructor() {
    super("Já existe um setor com este nome.");
  }
}

const UNIQUE_VIOLATION = "23505";

function falhar(error: { code?: string; message: string } | null) {
  if (error?.code === UNIQUE_VIOLATION) throw new NomeSetorDuplicadoError();
  if (error) throw new Error(error.message);
}

async function sincronizarMembros(setorId: string, antes: string[], depois: string[]) {
  const removidos = antes.filter((id) => !depois.includes(id));
  const adicionados = depois.filter((id) => !antes.includes(id));

  if (removidos.length > 0) {
    const { error } = await supabase
      .from("usuario_setores")
      .delete()
      .eq("setor_id", setorId)
      .in("usuario_id", removidos);
    falhar(error);
  }
  if (adicionados.length > 0) {
    const { error } = await supabase
      .from("usuario_setores")
      .insert(adicionados.map((usuario_id) => ({ usuario_id, setor_id: setorId })));
    falhar(error);
  }
  return { adicionados, removidos };
}

/** Cria (antes = null) ou edita um setor; o responsável sempre entra como membro. */
export async function salvarSetor(form: SetorForm, antes: SetorLista | null, usuarios: UsuarioOpcao[]) {
  const membros =
    form.responsavel_id && !form.membros_ids.includes(form.responsavel_id)
      ? [...form.membros_ids, form.responsavel_id]
      : form.membros_ids;
  const dados = {
    nome: form.nome.trim(),
    descricao: form.descricao?.trim() || null,
    ativo: form.ativo,
    responsavel_id: form.responsavel_id,
  };

  let setorId = antes?.id;
  if (antes) {
    const { error } = await supabase.from("setores").update(dados).eq("id", antes.id);
    falhar(error);
  } else {
    const { data, error } = await supabase.from("setores").insert(dados).select("id").single();
    falhar(error);
    setorId = data!.id as string;
  }

  const membrosAlterados = await sincronizarMembros(setorId!, antes?.membros_ids ?? [], membros);
  await registrarLogs(setorId!, dados, antes, membrosAlterados, usuarios);
}

async function registrarLogs(
  setorId: string,
  dados: Omit<SetorForm, "membros_ids">,
  antes: SetorLista | null,
  membros: { adicionados: string[]; removidos: string[] },
  usuarios: UsuarioOpcao[],
) {
  const nomeUsuario = (id: string) => {
    const u = usuarios.find((x) => x.id === id);
    return u?.nome || u?.email || "usuário";
  };
  const base = { alvo_tipo: "setor", alvo_id: setorId };
  const logs: Promise<void>[] = [];

  if (!antes) {
    logs.push(registrarAcao({ ...base, acao: "criar_setor", descricao: `criou o setor ${dados.nome}`, dados }));
  } else {
    const mudouDados = antes.nome !== dados.nome || (antes.descricao ?? null) !== dados.descricao;
    const mudouMembros = membros.adicionados.length > 0 || membros.removidos.length > 0;
    if (mudouDados || mudouMembros) {
      logs.push(
        registrarAcao({
          ...base,
          acao: "editar_setor",
          descricao: `editou o setor ${dados.nome}`,
          dados: {
            antes: { nome: antes.nome, descricao: antes.descricao },
            depois: { nome: dados.nome, descricao: dados.descricao },
            membros_adicionados: membros.adicionados.map(nomeUsuario),
            membros_removidos: membros.removidos.map(nomeUsuario),
          },
        }),
      );
    }
    if (antes.ativo !== dados.ativo) {
      logs.push(
        registrarAcao({
          ...base,
          acao: dados.ativo ? "ativar_setor" : "desativar_setor",
          descricao: `${dados.ativo ? "ativou" : "desativou"} o setor ${dados.nome}`,
        }),
      );
    }
  }

  if ((antes?.responsavel_id ?? null) !== dados.responsavel_id) {
    logs.push(
      registrarAcao({
        ...base,
        acao: "definir_responsavel_setor",
        descricao: dados.responsavel_id
          ? `definiu ${nomeUsuario(dados.responsavel_id)} como responsável do setor ${dados.nome}`
          : `removeu o responsável do setor ${dados.nome}`,
        dados: { anterior: antes?.responsavel_id ?? null, novo: dados.responsavel_id },
      }),
    );
  }

  await Promise.all(logs);
}
