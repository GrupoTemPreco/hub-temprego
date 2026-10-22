"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { alterarAtivoSetor, carregarSetoresAdmin, type SetorLista, type UsuarioOpcao } from "@/lib/admin/setores";
import { OPCOES_FILTRO_SETOR, filtrarSetores, parseFiltroSetor, type FiltroSetor } from "./filtrarSetores";
import { SetoresTabela } from "./SetoresTabela";
import { SetorModal } from "./SetorModal";
import { ExcluirSetorFluxo } from "./ExcluirSetorFluxo";

function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function SetoresTab({ filtroInicial }: { filtroInicial: string | null }) {
  const toast = useToast();
  const [setores, setSetores] = useState<SetorLista[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroSetor>(parseFiltroSetor(filtroInicial));
  const [editando, setEditando] = useState<SetorLista | "novo" | null>(null);
  const [excluindo, setExcluindo] = useState<SetorLista | null>(null);
  const [emAndamentoId, setEmAndamentoId] = useState<string | null>(null);

  const recarregar = useCallback(
    (): Promise<void> =>
      carregarSetoresAdmin()
        .then((dados) => {
          setSetores(dados.setores);
          setUsuarios(dados.usuarios);
        })
        .catch((err) => toast.error(`Erro ao carregar setores: ${mensagemErro(err)}`))
        .finally(() => setCarregando(false)),
    [toast],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const fecharExclusao = useCallback(() => setExcluindo(null), []);
  const visiveis = useMemo(() => filtrarSetores(setores, busca, filtro), [setores, busca, filtro]);
  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  async function alternarAtivo(setor: SetorLista, ativo: boolean) {
    setEmAndamentoId(setor.id);
    try {
      await alterarAtivoSetor(setor, ativo);
      toast.success(`Setor ${setor.nome} ${ativo ? "ativado" : "desativado"}.`);
      await recarregar();
    } catch (err) {
      toast.error(`Erro ao alterar o setor: ${mensagemErro(err)}`);
    } finally {
      setEmAndamentoId(null);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <label className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar setor..."
            className="w-full rounded-md border border-white/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <select
          aria-label="Filtrar setores"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as FiltroSetor)}
          className="rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          {OPCOES_FILTRO_SETOR.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button onClick={() => setEditando("novo")}>
          <Plus className="h-4 w-4" /> Novo setor
        </Button>
      </div>

      {carregando ? (
        <p className="p-4 text-sm text-white/60">Carregando setores...</p>
      ) : setores.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum setor cadastrado"
          description='Clique em "Novo setor" para criar o primeiro.'
        />
      ) : visiveis.length === 0 ? (
        <EmptyState title="Nenhum setor encontrado" description="Ajuste a busca ou o filtro." />
      ) : (
        <SetoresTabela
          setores={visiveis}
          usuarios={usuariosPorId}
          emAndamentoId={emAndamentoId}
          onToggleAtivo={alternarAtivo}
          onEditar={setEditando}
          onExcluir={setExcluindo}
        />
      )}

      {editando && (
        <SetorModal
          setor={editando === "novo" ? null : editando}
          usuarios={usuarios}
          onClose={() => setEditando(null)}
          onSalvo={recarregar}
        />
      )}

      {excluindo && (
        <ExcluirSetorFluxo key={excluindo.id} setor={excluindo} onFechar={fecharExclusao} onConcluido={recarregar} />
      )}
    </section>
  );
}
