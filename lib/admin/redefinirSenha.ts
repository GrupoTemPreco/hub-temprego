import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { nomeExibicao, type UsuarioLista } from "./usuarios";

/**
 * Pede ao servidor (rota com a service role) para trocar a senha do usuário.
 * A senha só vai no corpo da requisição: nunca no log nem nos dados da ação.
 */
export async function redefinirSenhaUsuario(usuario: UsuarioLista, senha: string, exigirTroca: boolean) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sua sessão expirou. Entre de novo.");

  const resposta = await fetch("/api/admin/redefinir-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ usuarioId: usuario.id, senha, exigirTroca }),
  });
  const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };
  if (!resposta.ok) throw new Error(corpo.erro ?? `Erro ${resposta.status} ao redefinir a senha.`);

  await registrarAcao({
    acao: "redefinir_senha",
    alvo_tipo: "usuario",
    alvo_id: usuario.id,
    descricao: `redefiniu a senha de ${nomeExibicao(usuario)}`,
    dados: { exigir_troca: exigirTroca },
  });
}
