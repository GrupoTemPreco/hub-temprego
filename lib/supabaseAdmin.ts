import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client com a service role, só para rotas do servidor (o "server-only" faz o build falhar
 * se este arquivo for importado em código de cliente). Ignora RLS: use com cuidado.
 */
export function criarSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Configuração do servidor incompleta.");
  return createClient(url, chave, {
    db: { schema: "shell" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
