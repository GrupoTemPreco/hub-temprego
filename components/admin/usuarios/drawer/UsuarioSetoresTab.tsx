"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { salvarSetoresUsuario } from "@/lib/admin/usuarioDetalhe";
import type { UsuarioLista } from "@/lib/admin/usuarios";
import type { Setor } from "@/lib/types/shell";

type Props = { usuario: UsuarioLista; setores: Setor[]; onAtualizado: () => Promise<void> };

export function UsuarioSetoresTab({ usuario, setores, onAtualizado }: Props) {
  const toast = useToast();
  // Vínculos com setores inativos ficam na seleção (ocultos) para não serem apagados ao salvar.
  const [selecionados, setSelecionados] = useState<string[]>(usuario.setores_ids);
  const [salvando, setSalvando] = useState(false);
  const ativos = setores.filter((s) => s.ativo);

  function alternar(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const alterou = await salvarSetoresUsuario(usuario, selecionados, setores);
      toast.success(alterou ? "Setores do usuário atualizados." : "Nenhuma alteração para salvar.");
      if (alterou) await onAtualizado();
    } catch (err) {
      toast.error(`Erro ao salvar setores: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  if (ativos.length === 0) {
    return <EmptyState compact title="Nenhum setor ativo" description="Cadastre setores para vinculá-los aos usuários." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Selecione os setores dos quais este usuário faz parte.</p>
      <div className="flex flex-wrap gap-2">
        {ativos.map((s) => {
          const marcado = selecionados.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={marcado}
              onClick={() => alternar(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                marcado
                  ? "border-blue-500 bg-blue-600/20 text-blue-200"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {marcado && <Check className="h-3.5 w-3.5" />}
              {s.nome}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar setores"}
        </Button>
      </div>
    </div>
  );
}
