import { criarSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MSG_SENHA_CURTA, SENHA_MINIMA } from "@/lib/senhas";

// A senha nunca vai para log, console nem resposta.

function responder(status: number, erro?: string) {
  return Response.json(erro ? { erro } : { ok: true }, { status });
}

/** POST { usuarioId, senha, exigirTroca } com Authorization: Bearer <access_token> de um admin. */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return responder(401, "Sessão não informada.");

  let corpo: { usuarioId?: unknown; senha?: unknown; exigirTroca?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return responder(400, "Requisição inválida.");
  }

  let admin: ReturnType<typeof criarSupabaseAdmin>;
  try {
    admin = criarSupabaseAdmin();
  } catch {
    return responder(500, "Configuração do servidor incompleta.");
  }

  const { data: autenticado, error: erroToken } = await admin.auth.getUser(token);
  if (erroToken || !autenticado.user) return responder(401, "Sessão inválida ou expirada. Entre de novo.");

  const { data: quemChama, error: erroPerfil } = await admin
    .from("usuarios")
    .select("is_admin")
    .eq("id", autenticado.user.id)
    .maybeSingle();
  if (erroPerfil) return responder(500, "Não foi possível conferir a permissão.");
  if (!quemChama?.is_admin) return responder(403, "Só administradores podem redefinir senhas.");

  const { usuarioId, senha, exigirTroca } = corpo;
  if (typeof usuarioId !== "string" || !usuarioId) return responder(400, "Usuário não informado.");
  if (typeof senha !== "string" || senha.length < SENHA_MINIMA) return responder(400, MSG_SENHA_CURTA);

  const { error: erroSenha } = await admin.auth.admin.updateUserById(usuarioId, { password: senha });
  if (erroSenha) return responder(400, `Não foi possível redefinir a senha: ${erroSenha.message}`);

  const { error: erroTroca } = await admin
    .from("usuarios")
    .update({ trocar_senha: exigirTroca === true })
    .eq("id", usuarioId);
  if (erroTroca) {
    return responder(500, `A senha foi redefinida, mas não foi possível gravar a troca obrigatória: ${erroTroca.message}`);
  }

  return responder(200);
}
