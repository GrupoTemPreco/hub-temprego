"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { situacaoNotificacao, type SituacaoNotificacao } from "@/lib/notificacoes";
import {
  alterarAtivaNotificacao,
  carregarDadosNotificacoes,
  excluirNotificacao,
  type DadosNotificacoes,
} from "@/lib/admin/notificacoes";
import type { Notificacao } from "@/lib/types/shell";
import { NotificacoesTabela, type AcaoNotificacao } from "./NotificacoesTabela";
import { NotificacaoModal, type ModoModal } from "./NotificacaoModal";
import { LeitoresDrawer } from "./LeitoresDrawer";

const ROTULOS: Record<SituacaoNotificacao, string> = { ativa: "Ativas", agendada: "Agendadas", encerrada: "Encerradas" };

type Confirmacao = { tipo: "encerrar" | "excluir"; notificacao: Notificacao } | null;

export function NotificacoesPainel() {
  const toast = useToast();
  const [dados, setDados] = useState<DadosNotificacoes | null>(null);
  const [situacao, setSituacao] = useState<SituacaoNotificacao>("ativa");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<ModoModal | null>(null);
  const [leitores, setLeitores] = useState<Notificacao | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = useCallback(
    (): Promise<void> =>
      carregarDadosNotificacoes()
        .then(setDados)
        .catch((err) => toast.error(`Erro ao carregar notificações: ${err.message}`)),
    [toast],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const porSituacao = useMemo(() => {
    const grupos: Record<SituacaoNotificacao, Notificacao[]> = { ativa: [], agendada: [], encerrada: [] };
    for (const n of dados?.notificacoes ?? []) grupos[situacaoNotificacao(n)].push(n);
    return grupos;
  }, [dados]);

  const termo = busca.trim().toLowerCase();
  const visiveis = porSituacao[situacao].filter((n) => !termo || n.titulo.toLowerCase().includes(termo));

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setOcupado(true);
    try {
      await acao();
      toast.success(sucesso);
      await recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setOcupado(false);
      setConfirmacao(null);
    }
  }

  function aoAcionar(acao: AcaoNotificacao, n: Notificacao) {
    if (acao === "editar") setModal({ tipo: "editar", notificacao: n });
    if (acao === "duplicar") setModal({ tipo: "duplicar", notificacao: n });
    if (acao === "leitores") setLeitores(n);
    if (acao === "encerrar" || acao === "excluir") setConfirmacao({ tipo: acao, notificacao: n });
    if (acao === "reativar") executar(() => alterarAtivaNotificacao(n, true), `"${n.titulo}" reativada.`);
  }

  function confirmar() {
    if (!confirmacao) return;
    const n = confirmacao.notificacao;
    if (confirmacao.tipo === "encerrar") executar(() => alterarAtivaNotificacao(n, false), `"${n.titulo}" encerrada.`);
    else executar(() => excluirNotificacao(n), `"${n.titulo}" excluída.`);
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <Tabs
          value={situacao}
          onChange={setSituacao}
          items={(Object.keys(ROTULOS) as SituacaoNotificacao[]).map((s) => ({
            id: s,
            label: ROTULOS[s],
            count: porSituacao[s].length,
          }))}
        />
        <label className="relative min-w-50 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full rounded-md border border-white/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <Button onClick={() => setModal({ tipo: "nova" })} disabled={!dados}>
          <Plus className="h-4 w-4" /> Nova notificação
        </Button>
      </div>

      {!dados ? (
        <p className="p-4 text-sm text-white/60">Carregando notificações...</p>
      ) : visiveis.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={termo ? "Nenhuma notificação encontrada" : `Nenhuma notificação ${ROTULOS[situacao].toLowerCase().slice(0, -1)}`}
          description={termo ? "Ajuste a busca." : 'Clique em "Nova notificação" para criar uma.'}
        />
      ) : (
        <NotificacoesTabela notificacoes={visiveis} dados={dados} onAcao={aoAcionar} />
      )}

      {modal && dados && <NotificacaoModal modo={modal} dados={dados} onClose={() => setModal(null)} onSalvo={recarregar} />}
      {leitores && dados && <LeitoresDrawer notificacao={leitores} dados={dados} onClose={() => setLeitores(null)} />}

      <ConfirmDialog
        open={confirmacao !== null}
        danger={confirmacao?.tipo === "excluir"}
        title={confirmacao?.tipo === "excluir" ? "Excluir notificação?" : "Encerrar notificação agora?"}
        description={
          confirmacao?.tipo === "excluir"
            ? `"${confirmacao.notificacao.titulo}" e o registro de quem viu serão apagados.`
            : `"${confirmacao?.notificacao.titulo}" deixa de ser exibida imediatamente.`
        }
        confirmLabel={confirmacao?.tipo === "excluir" ? "Excluir" : "Encerrar"}
        loading={ocupado}
        onConfirm={confirmar}
        onCancel={() => setConfirmacao(null)}
      />
    </section>
  );
}
