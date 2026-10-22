"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import type { SetorLista, UsuarioOpcao } from "@/lib/admin/setores";

type Props = {
  setores: SetorLista[];
  usuarios: Map<string, UsuarioOpcao>;
  emAndamentoId: string | null;
  onToggleAtivo: (setor: SetorLista, ativo: boolean) => void;
  onEditar: (setor: SetorLista) => void;
  onExcluir: (setor: SetorLista) => void;
};

const ACAO = "rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40";

export function SetoresTabela({ setores, usuarios, emAndamentoId, onToggleAtivo, onEditar, onExcluir }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-4 py-3 font-medium">Nome do setor</th>
            <th className="px-4 py-3 font-medium">Responsável</th>
            <th className="px-4 py-3 text-center font-medium">Membros</th>
            <th className="px-4 py-3 text-center font-medium">Tickets abertos</th>
            <th className="px-4 py-3 text-center font-medium">Ativo</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {setores.map((s) => {
            const responsavel = s.responsavel_id ? usuarios.get(s.responsavel_id) : undefined;
            const ocupado = emAndamentoId === s.id;
            return (
              <tr key={s.id} className={`border-b border-white/5 hover:bg-white/4 ${s.ativo ? "" : "opacity-60"}`}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.nome}</p>
                  {s.descricao && <p className="max-w-xs truncate text-xs text-white/50">{s.descricao}</p>}
                </td>
                <td className="px-4 py-3">
                  {s.responsavel_id ? (
                    <span className="flex items-center gap-2">
                      <Avatar nome={responsavel?.nome ?? null} email={responsavel?.email} />
                      <span>{responsavel?.nome || responsavel?.email || "Usuário removido"}</span>
                    </span>
                  ) : (
                    <Badge variant="warning">Sem responsável</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">{s.membros_ids.length}</td>
                <td className="px-4 py-3 text-center">{s.tickets_abertos}</td>
                <td className="px-4 py-3 text-center">
                  <Toggle
                    label={`Setor ${s.nome} ativo`}
                    checked={s.ativo}
                    disabled={ocupado}
                    onChange={(v) => onToggleAtivo(s, v)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button className={ACAO} title="Editar" disabled={ocupado} onClick={() => onEditar(s)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className={`${ACAO} hover:text-rose-300`}
                      title="Excluir"
                      disabled={ocupado}
                      onClick={() => onExcluir(s)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
