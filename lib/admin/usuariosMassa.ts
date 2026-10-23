import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { PERMISSOES_DISPONIVEIS, type PermissaoKey } from "@/lib/permissoes";
import { dadosDoLog, executarEmLote, quantidade, type ResultadoMassa } from "@/lib/acoesMassa";
import { nomeExibicao, type UsuarioLista } from "./usuarios";

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const usuariosTexto = (n: number) => quantidade(n, "usuário", "usuários");

function emLote(usuarios: UsuarioLista[], acao: (u: UsuarioLista) => Promise<void>) {
  return executarEmLote(usuarios, (u) => u.id, nomeExibicao, acao);
}

async function registrar(acao: string, descricao: string, r: ResultadoMassa, extras?: Record<string, unknown>) {
  if (r.ok.length === 0) return;
  await registrarAcao({ acao, alvo_tipo: "usuario", alvo_id: null, descricao, dados: dadosDoLog(r, extras) });
}

export type StatusMassa = "aprovado" | "rejeitado";

export async function statusEmMassa(usuarios: UsuarioLista[], status: StatusMassa) {
  const r = await emLote(usuarios, async (u) => {
    const { error } = await supabase.from("usuarios").update({ status }).eq("id", u.id);
    falhar(error);
  });
  const verbo = status === "aprovado" ? "aprovou" : "rejeitou";
  await registrar("massa_status_usuarios", `${verbo} ${usuariosTexto(r.ok.length)} em massa`, r, { status });
  return r;
}

export type CampoLigavel = "recebe_tickets" | "acesso_checklist";

export const ROTULO_CAMPO: Record<CampoLigavel, string> = {
  recebe_tickets: "Recebe tickets",
  acesso_checklist: "Acesso ao checklist",
};

export async function ligarEmMassa(usuarios: UsuarioLista[], campo: CampoLigavel, valor: boolean) {
  const r = await emLote(usuarios, async (u) => {
    const { error } = await supabase.from("usuarios").update({ [campo]: valor }).eq("id", u.id);
    falhar(error);
  });
  await registrar(
    `massa_${campo}`,
    `alterou ${ROTULO_CAMPO[campo]} de ${usuariosTexto(r.ok.length)} (${valor ? "ligado" : "desligado"})`,
    r,
    { [campo]: valor },
  );
  return r;
}

export type ModoSetores = "adicionar" | "remover" | "substituir";

/** O que inserir e apagar em usuario_setores para chegar ao resultado do modo escolhido. */
function diferencaSetores(atuais: string[], escolhidos: string[], modo: ModoSetores) {
  const tem = new Set(atuais);
  const quer = new Set(escolhidos);
  if (modo === "adicionar") return { inserir: escolhidos.filter((id) => !tem.has(id)), apagar: [] };
  if (modo === "remover") return { inserir: [], apagar: escolhidos.filter((id) => tem.has(id)) };
  return { inserir: escolhidos.filter((id) => !tem.has(id)), apagar: atuais.filter((id) => !quer.has(id)) };
}

export async function setoresEmMassa(usuarios: UsuarioLista[], modo: ModoSetores, setorIds: string[], nomes: string[]) {
  const r = await emLote(usuarios, async (u) => {
    const { inserir, apagar } = diferencaSetores(u.setores_ids, setorIds, modo);
    if (apagar.length > 0) {
      const { error } = await supabase.from("usuario_setores").delete().eq("usuario_id", u.id).in("setor_id", apagar);
      falhar(error);
    }
    if (inserir.length > 0) {
      const { error } = await supabase
        .from("usuario_setores")
        .insert(inserir.map((setor_id) => ({ usuario_id: u.id, setor_id })));
      falhar(error);
    }
  });
  const verbo = { adicionar: "adicionou", remover: "removeu", substituir: "substituiu os setores de" }[modo];
  const descricao =
    modo === "substituir"
      ? `${verbo} ${usuariosTexto(r.ok.length)} por ${nomes.join(", ")}`
      : `${verbo} ${usuariosTexto(r.ok.length)} ${modo === "adicionar" ? "a" : "de"} ${nomes.join(", ")}`;
  await registrar("massa_setores_usuarios", descricao, r, { modo, setores: nomes });
  return r;
}

export type MudancaPermissao = "conceder" | "remover";

/** Conceder só insere para quem ainda não tem (com nome_usuario, como na gravação individual). */
export async function permissoesEmMassa(usuarios: UsuarioLista[], mudancas: Partial<Record<PermissaoKey, MudancaPermissao>>) {
  const conceder = PERMISSOES_DISPONIVEIS.filter((p) => mudancas[p.key] === "conceder");
  const remover = PERMISSOES_DISPONIVEIS.filter((p) => mudancas[p.key] === "remover");

  const { data, error } = await supabase
    .from("permissoes")
    .select("user_id, modulo, item")
    .in(
      "user_id",
      usuarios.map((u) => u.id),
    );
  falhar(error);
  const atuais = new Set((data ?? []).map((p) => `${p.user_id}|${p.modulo}|${p.item}`));

  const r = await emLote(usuarios, async (u) => {
    const faltando = conceder.filter((p) => !atuais.has(`${u.id}|${p.modulo}|${p.item}`));
    if (faltando.length > 0) {
      const { error: e } = await supabase
        .from("permissoes")
        .insert(faltando.map((p) => ({ user_id: u.id, modulo: p.modulo, item: p.item, nome_usuario: u.nome })));
      falhar(e);
    }
    if (remover.length > 0) {
      const filtro = remover.map((p) => `and(modulo.eq.${p.modulo},item.eq.${p.item})`).join(",");
      const { error: e } = await supabase.from("permissoes").delete().eq("user_id", u.id).or(filtro);
      falhar(e);
    }
  });

  await registrar("massa_permissoes_usuarios", `alterou as permissões de ${usuariosTexto(r.ok.length)}`, r, {
    concedidas: conceder.map((p) => p.key),
    removidas: remover.map((p) => p.key),
  });
  return r;
}
