import type { UsuarioLista } from "@/lib/admin/usuarios";
import type { FiltrosUsuarios } from "./UsuariosFiltros";

/** Aplica busca e filtros e coloca os pendentes no topo, mantendo a ordem por nome. */
export function filtrarUsuarios(usuarios: UsuarioLista[], filtros: FiltrosUsuarios): UsuarioLista[] {
  const termo = filtros.busca.trim().toLowerCase();

  return usuarios
    .filter((u) => {
      if (filtros.status !== "todos" && u.status !== filtros.status) return false;
      if (filtros.setorId && !u.setores_ids.includes(filtros.setorId)) return false;
      if (!termo) return true;
      return (u.nome ?? "").toLowerCase().includes(termo) || (u.email ?? "").toLowerCase().includes(termo);
    })
    .sort((a, b) => Number(b.status === "pendente") - Number(a.status === "pendente"));
}
