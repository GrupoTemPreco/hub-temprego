import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { rotuloFerramentaMenu } from "@/lib/ferramentas";
import type { DestaqueMenu } from "@/lib/types/shell";

export type DestaquePayload = Pick<DestaqueMenu, "ferramenta_id" | "texto" | "cor" | "inicio_em" | "fim_em" | "ativo">;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const descrever = (d: Pick<DestaqueMenu, "texto" | "ferramenta_id">) =>
  `o destaque "${d.texto}" em ${rotuloFerramentaMenu(d.ferramenta_id)}`;

const log = (acao: string, id: string, descricao: string, dados?: Record<string, unknown>) =>
  registrarAcao({ acao, alvo_tipo: "destaque_menu", alvo_id: id, descricao, dados });

export async function listarDestaques(): Promise<DestaqueMenu[]> {
  const { data, error } = await supabase.from("destaques_menu").select("*").order("criado_em", { ascending: false });
  falhar(error);
  return (data ?? []) as DestaqueMenu[];
}

export async function salvarDestaque(payload: DestaquePayload, antes: DestaqueMenu | null, autorId: string) {
  if (antes) {
    const { error } = await supabase.from("destaques_menu").update(payload).eq("id", antes.id);
    falhar(error);
    await log("editar_destaque", antes.id, `editou ${descrever(payload)}`, {
      antes: { texto: antes.texto, cor: antes.cor, inicio_em: antes.inicio_em, fim_em: antes.fim_em, ativo: antes.ativo },
    });
    return;
  }
  const { data, error } = await supabase
    .from("destaques_menu")
    .insert({ ...payload, criado_por: autorId })
    .select("id")
    .single();
  falhar(error);
  await log("criar_destaque", data!.id as string, `criou ${descrever(payload)}`);
}

export async function alterarAtivoDestaque(d: DestaqueMenu, ativo: boolean) {
  const { error } = await supabase.from("destaques_menu").update({ ativo }).eq("id", d.id);
  falhar(error);
  await log(ativo ? "reativar_destaque" : "encerrar_destaque", d.id, `${ativo ? "reativou" : "encerrou"} ${descrever(d)}`);
}

export async function excluirDestaque(d: DestaqueMenu) {
  const { error } = await supabase.from("destaques_menu").delete().eq("id", d.id);
  falhar(error);
  await log("excluir_destaque", d.id, `excluiu ${descrever(d)}`);
}
