"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckboxSelecao } from "@/components/ui/CheckboxSelecao";
import type { Selecao } from "@/hooks/useSelecao";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { UsuarioStatusBadge } from "../StatusBadges";
import type { UsuarioLista } from "@/lib/admin/usuarios";
import type { Setor } from "@/lib/types/shell";

type Props = {
  usuarios: UsuarioLista[];
  setores: Setor[];
  selecao: Selecao;
  emAndamentoId: string | null;
  onAbrir: (usuario: UsuarioLista) => void;
  onAprovar: (usuario: UsuarioLista) => void;
  onRejeitar: (usuario: UsuarioLista) => void;
};

export function UsuariosTabela({ usuarios, setores, selecao, emAndamentoId, onAbrir, onAprovar, onRejeitar }: Props) {
  const usuarioAtualId = useUsuarioAtual().id;

  if (usuarios.length === 0) {
    return <EmptyState title="Nenhum usuário encontrado" description="Ajuste a busca ou os filtros." />;
  }

  const nomeSetor = new Map(setores.map((s) => [s.id, s.nome]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="w-10 py-3 pl-4">
              <CheckboxSelecao
                checked={selecao.todosVisiveis}
                indeterminado={selecao.algunsVisiveis}
                onChange={selecao.alternarTodosVisiveis}
                rotulo="Selecionar todos os usuários visíveis"
              />
            </th>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium">Setores</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Admin</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const pendente = u.status === "pendente";
            const ocupado = emAndamentoId === u.id;
            return (
              <tr
                key={u.id}
                onClick={() => onAbrir(u)}
                className={`cursor-pointer border-b border-white/5 transition-colors ${
                  pendente ? "bg-amber-500/7 hover:bg-amber-500/12" : "hover:bg-white/4"
                }`}
              >
                <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                  <CheckboxSelecao
                    checked={selecao.estaSelecionado(u.id)}
                    onChange={() => selecao.alternar(u.id)}
                    rotulo={`Selecionar ${u.nome || u.email || "usuário"}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar nome={u.nome} email={u.email} />
                    <span className="font-medium">{u.nome || "Sem nome"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/65">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.setores_ids.length === 0 && <span className="text-white/35">—</span>}
                    {u.setores_ids.map((id) => (
                      <span key={id} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/75">
                        {nomeSetor.get(id) ?? "Setor removido"}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <UsuarioStatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3">
                  {u.is_admin ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-300" title="Administrador">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {pendente && (
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="success" disabled={ocupado} onClick={() => onAprovar(u)}>
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                      {u.id !== usuarioAtualId && (
                        <Button size="sm" variant="danger" disabled={ocupado} onClick={() => onRejeitar(u)}>
                          <X className="h-3.5 w-3.5" /> Rejeitar
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
