"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Play, Plus, Sparkles, Square, Trash2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { MenuIcon, type MenuIconKind } from "@/components/hub/MenuIcon";
import { SeloDestaque } from "@/components/hub/SeloDestaque";
import { useDestaquesMenu } from "@/components/hub/DestaquesMenuProvider";
import { formatarDataHoraSP } from "@/lib/datas";
import { rotuloFerramentaMenu } from "@/lib/ferramentas";
import { podeReativarDestaque, situacaoDestaque, type SituacaoDestaque } from "@/lib/destaques";
import { alterarAtivoDestaque, excluirDestaque, listarDestaques } from "@/lib/admin/destaques";
import type { DestaqueMenu } from "@/lib/types/shell";
import { DestaqueModal } from "./DestaqueModal";

const SITUACAO: Record<SituacaoDestaque, { label: string; cor: BadgeVariant }> = {
  vigente: { label: "Vigente", cor: "success" },
  agendado: { label: "Agendado", cor: "info" },
  encerrado: { label: "Encerrado", cor: "neutral" },
};

const BOTAO = "rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white";

export function DestaquesPainel() {
  const toast = useToast();
  const { recarregar: recarregarMenu } = useDestaquesMenu();
  const [destaques, setDestaques] = useState<DestaqueMenu[] | null>(null);
  const [editando, setEditando] = useState<DestaqueMenu | "novo" | null>(null);
  const [excluindo, setExcluindo] = useState<DestaqueMenu | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = useCallback(
    (): Promise<void> =>
      listarDestaques()
        .then((lista) => {
          setDestaques(lista);
          return recarregarMenu();
        })
        .catch((err) => toast.error(`Erro ao carregar destaques: ${err.message}`)),
    [toast, recarregarMenu],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

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
      setExcluindo(null);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <p className="text-sm text-white/60">Selos exibidos ao lado das ferramentas na sidebar e nos atalhos do Início.</p>
        <Button onClick={() => setEditando("novo")} disabled={!destaques}>
          <Plus className="h-4 w-4" /> Novo destaque
        </Button>
      </div>

      {!destaques ? (
        <p className="p-4 text-sm text-white/60">Carregando destaques...</p>
      ) : destaques.length === 0 ? (
        <EmptyState icon={Sparkles} title="Nenhum destaque cadastrado" description='Clique em "Novo destaque" para criar um selo.' />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">Ferramenta</th>
                <th className="px-4 py-3 font-medium">Selo</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {destaques.map((d) => {
                const situacao = situacaoDestaque(d);
                const podeReativar = podeReativarDestaque(d);
                return (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <MenuIcon kind={d.ferramenta_id as MenuIconKind} className="h-5 w-5 shrink-0 text-white/70" />
                        {rotuloFerramentaMenu(d.ferramenta_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SeloDestaque texto={d.texto} cor={d.cor} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-white/60">
                      {formatarDataHoraSP(d.inicio_em)} até {d.fim_em ? formatarDataHoraSP(d.fim_em) : "sem fim"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SITUACAO[situacao].cor}>{SITUACAO[situacao].label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-0.5">
                        <button className={BOTAO} title="Editar" disabled={ocupado} onClick={() => setEditando(d)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        {situacao !== "encerrado" && (
                          <button className={`${BOTAO} hover:text-amber-300`} title="Encerrar agora" disabled={ocupado}
                            onClick={() => executar(() => alterarAtivoDestaque(d, false), "Destaque encerrado.")}>
                            <Square className="h-4 w-4" />
                          </button>
                        )}
                        {podeReativar && (
                          <button className={`${BOTAO} hover:text-emerald-300`} title="Reativar" disabled={ocupado}
                            onClick={() => executar(() => alterarAtivoDestaque(d, true), "Destaque reativado.")}>
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button className={`${BOTAO} hover:text-rose-300`} title="Excluir" disabled={ocupado} onClick={() => setExcluindo(d)}>
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
      )}

      {editando && destaques && (
        <DestaqueModal
          destaque={editando === "novo" ? null : editando}
          todos={destaques}
          onClose={() => setEditando(null)}
          onSalvo={recarregar}
        />
      )}

      <ConfirmDialog
        open={excluindo !== null}
        danger
        title="Excluir destaque?"
        description={excluindo && `O selo "${excluindo.texto}" de ${rotuloFerramentaMenu(excluindo.ferramenta_id)} será apagado.`}
        confirmLabel="Excluir"
        loading={ocupado}
        onConfirm={() => excluindo && executar(() => excluirDestaque(excluindo), "Destaque excluído.")}
        onCancel={() => setExcluindo(null)}
      />
    </section>
  );
}
