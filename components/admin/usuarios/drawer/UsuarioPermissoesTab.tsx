"use client";

import { useEffect, useState } from "react";
import { BarChart3, ClipboardCheck, KeyRound, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { agruparPermissoes, type PermissoesMarcadas } from "@/lib/permissoes";
import { carregarPermissoesUsuario, salvarPermissoesUsuario } from "@/lib/admin/usuarioDetalhe";
import type { UsuarioLista } from "@/lib/admin/usuarios";

const ICONES: Record<string, typeof KeyRound> = { analytics: BarChart3, checklist: ClipboardCheck, rh: Users };
const GRUPOS = agruparPermissoes();

type Props = { usuario: UsuarioLista; onAtualizado: () => Promise<void> };

export function UsuarioPermissoesTab({ usuario, onAtualizado }: Props) {
  const toast = useToast();
  const [original, setOriginal] = useState<PermissoesMarcadas | null>(null);
  const [marcadas, setMarcadas] = useState<PermissoesMarcadas | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarPermissoesUsuario(usuario.id)
      .then((dados) => {
        if (!ativo) return;
        setOriginal(dados);
        setMarcadas(dados);
      })
      .catch((err) => toast.error(`Erro ao carregar permissões: ${err.message}`));
    return () => {
      ativo = false;
    };
  }, [usuario.id, toast]);

  async function salvar() {
    if (!marcadas) return;
    setSalvando(true);
    try {
      await salvarPermissoesUsuario(usuario, marcadas);
      setOriginal(marcadas);
      toast.success("Permissões atualizadas com sucesso.");
      await onAtualizado();
    } catch (err) {
      toast.error(`Erro ao salvar permissões: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  if (!marcadas) return <p className="text-sm text-white/60">Carregando permissões...</p>;

  const alterado = JSON.stringify(marcadas) !== JSON.stringify(original);

  return (
    <div className="space-y-4">
      {GRUPOS.map((grupo) => {
        const Icon = ICONES[grupo.modulo] ?? KeyRound;
        return (
          <div key={grupo.modulo} className="rounded-lg border border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-300">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{grupo.titulo}</span>
            </div>
            <ul className="divide-y divide-white/5">
              {grupo.itens.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm text-white/80">{p.itemLabel}</span>
                  <Toggle
                    label={p.label}
                    checked={marcadas[p.key]}
                    onChange={(v) => setMarcadas({ ...marcadas, [p.key]: v })}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" disabled={!alterado || salvando} onClick={() => setMarcadas(original)}>
          Cancelar
        </Button>
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar permissões"}
        </Button>
      </div>
    </div>
  );
}
