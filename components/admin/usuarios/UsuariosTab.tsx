"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  alterarStatusUsuario,
  listarUsuariosESetores,
  nomeExibicao,
  type UsuarioLista,
} from "@/lib/admin/usuarios";
import type { Setor } from "@/lib/types/shell";
import { UsuariosFiltros, parseFiltroStatus, type FiltrosUsuarios } from "./UsuariosFiltros";
import { UsuariosTabela } from "./UsuariosTabela";
import { filtrarUsuarios } from "./filtrarUsuarios";
import { UsuarioDrawer, type AbaUsuario } from "./drawer/UsuarioDrawer";
import { UsuariosAcoesMassa } from "./massa/UsuariosAcoesMassa";
import { useSelecao } from "@/hooks/useSelecao";

function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function UsuariosTab({ statusInicial }: { statusInicial: string | null }) {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    busca: "",
    status: parseFiltroStatus(statusInicial),
    setorId: "",
  });
  const [aberto, setAberto] = useState<{ id: string; aba: AbaUsuario } | null>(null);
  const [rejeitando, setRejeitando] = useState<UsuarioLista | null>(null);
  const [emAndamentoId, setEmAndamentoId] = useState<string | null>(null);

  const recarregar = useCallback(
    (): Promise<void> =>
      listarUsuariosESetores()
        .then((dados) => {
          setUsuarios(dados.usuarios);
          setSetores(dados.setores);
        })
        .catch((err) => toast.error(`Erro ao carregar usuários: ${mensagemErro(err)}`))
        .finally(() => setCarregando(false)),
    [toast],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const visiveis = useMemo(() => filtrarUsuarios(usuarios, filtros), [usuarios, filtros]);
  const selecao = useSelecao(visiveis.map((u) => u.id));
  const selecionados = usuarios.filter((u) => selecao.estaSelecionado(u.id));
  const usuarioAberto = aberto ? usuarios.find((u) => u.id === aberto.id) ?? null : null;

  async function aprovar(usuario: UsuarioLista) {
    setEmAndamentoId(usuario.id);
    try {
      await alterarStatusUsuario(usuario, "aprovado");
      toast.success(`${nomeExibicao(usuario)} foi aprovado. Defina as permissões.`);
      await recarregar();
      setAberto({ id: usuario.id, aba: "permissoes" });
    } catch (err) {
      toast.error(`Erro ao aprovar: ${mensagemErro(err)}`);
    } finally {
      setEmAndamentoId(null);
    }
  }

  async function confirmarRejeicao() {
    if (!rejeitando) return;
    setEmAndamentoId(rejeitando.id);
    try {
      await alterarStatusUsuario(rejeitando, "rejeitado");
      toast.success(`${nomeExibicao(rejeitando)} foi rejeitado.`);
      await recarregar();
    } catch (err) {
      toast.error(`Erro ao rejeitar: ${mensagemErro(err)}`);
    } finally {
      setEmAndamentoId(null);
      setRejeitando(null);
    }
  }

  const pendentes = usuarios.filter((u) => u.status === "pendente").length;

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Usuários</h2>
          {pendentes > 0 && <span className="text-xs text-amber-300">{pendentes} aguardando aprovação</span>}
        </div>
        <UsuariosFiltros filtros={filtros} setores={setores} onChange={setFiltros} />
      </div>

      {carregando ? (
        <p className="p-4 text-sm text-white/60">Carregando usuários...</p>
      ) : (
        <UsuariosTabela
          usuarios={visiveis}
          setores={setores}
          selecao={selecao}
          emAndamentoId={emAndamentoId}
          onAbrir={(u) => setAberto({ id: u.id, aba: "dados" })}
          onAprovar={aprovar}
          onRejeitar={setRejeitando}
        />
      )}

      <UsuariosAcoesMassa
        selecionados={selecionados}
        setores={setores}
        onLimpar={selecao.limpar}
        onConcluido={recarregar}
      />

      {usuarioAberto && aberto && (
        <UsuarioDrawer
          key={`${aberto.id}-${aberto.aba}`}
          usuario={usuarioAberto}
          setores={setores}
          abaInicial={aberto.aba}
          onClose={() => setAberto(null)}
          onAtualizado={recarregar}
        />
      )}

      <ConfirmDialog
        open={rejeitando !== null}
        danger
        title="Rejeitar usuário?"
        description={
          rejeitando && (
            <>
              <strong className="text-white">{nomeExibicao(rejeitando)}</strong> não terá acesso ao sistema.
            </>
          )
        }
        confirmLabel="Rejeitar"
        loading={emAndamentoId !== null && emAndamentoId === rejeitando?.id}
        onConfirm={confirmarRejeicao}
        onCancel={() => setRejeitando(null)}
      />
    </section>
  );
}
