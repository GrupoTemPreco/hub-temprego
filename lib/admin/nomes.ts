import { supabase } from "@/lib/supabase";

/** Busca os nomes (ou e-mails) de uma lista de usuários: id -> nome. */
export async function buscarNomesUsuarios(ids: Array<string | null>): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const mapa = new Map<string, string>();
  if (unicos.length === 0) return mapa;

  const { data, error } = await supabase.from("usuarios").select("id, nome, email").in("id", unicos);
  if (error) throw error;

  for (const u of data ?? []) mapa.set(u.id, u.nome || u.email || "Usuário");
  return mapa;
}
