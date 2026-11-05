"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { DetalheTarefaLeitura } from "@/components/checklist/DetalheTarefaLeitura";
import { useListasMinimizadas } from "@/components/checklist/useListasMinimizadas";
import { carregarDetalheRh, type DetalheUsuarioRh, type ResumoUsuarioRh } from "@/lib/rhMonitoramento";
import { formatarHoras } from "@/lib/rhRegras";
import { AcessoRelativo, NumeroAlerta, PercentualPrazo, SetoresChips } from "./IndicadoresRh";
import { AbaChecklistRh } from "./AbaChecklistRh";
import { AbaConcluidasRh } from "./AbaConcluidasRh";
import { AbaEnviosRh } from "./AbaEnviosRh";

type Aba = "checklist" | "concluidas" | "envios";

const ABAS: TabItem<Aba>[] = [
  { id: "checklist", label: "Checklist" },
  { id: "concluidas", label: "Concluídas" },
  { id: "envios", label: "Envios" },
];

function Indicador({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/3 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-white/45">{rotulo}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

type Props = { usuario: ResumoUsuarioRh; dias: number; agora: number; onClose: () => void };

/** Detalhe em leitura. Cabeçalho e abas ficam fixos; só o miolo rola. */
export function UsuarioRhModal({ usuario, dias, agora, onClose }: Props) {
  const [aba, setAba] = useState<Aba>("checklist");
  const [detalhe, setDetalhe] = useState<DetalheUsuarioRh | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tarefaId, setTarefaId] = useState<string | null>(null);
  const minimizadas = useListasMinimizadas(null);

  useEffect(() => {
    let vivo = true;
    carregarDetalheRh(usuario.usuario_id)
      .then((d) => vivo && setDetalhe(d))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : String(err)));
    return () => {
      vivo = false;
    };
  }, [usuario.usuario_id]);

  const tarefa = detalhe?.itens.find((item) => item.id === tarefaId) ?? null;
  const nomeLista = detalhe?.listas.find((lista) => lista.id === tarefa?.grupo_id)?.nome ?? "—";

  return (
    <Modal
      open
      onClose={onClose}
      size="painel"
      cabecalho={
        <div className="flex items-start gap-3">
          <Avatar nome={usuario.nome} email={usuario.email} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-lg font-semibold text-white">{usuario.nome || usuario.email}</p>
            {usuario.nome && <p className="truncate text-sm text-white/55">{usuario.email}</p>}
            <SetoresChips setores={usuario.setores} />
            <p className="text-xs text-white/55">
              Último acesso ao checklist: <AcessoRelativo iso={usuario.ultimo_acesso_checklist_em} agora={agora} alertar />
            </p>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-5">
          <Tabs
            items={ABAS}
            value={aba}
            onChange={(id) => {
              setAba(id);
              setTarefaId(null);
            }}
            variant="underline"
          />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 ${tarefa ? "max-lg:hidden" : ""}`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <Indicador rotulo="Último acesso ao hub">
                  <AcessoRelativo iso={usuario.ultimo_acesso_em} agora={agora} />
                </Indicador>
                <Indicador rotulo="Última atividade">
                  <AcessoRelativo iso={usuario.ultima_atividade_em} agora={agora} />
                </Indicador>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <Indicador rotulo="Pendentes">{usuario.pendentes}</Indicador>
                <Indicador rotulo="Críticos">
                  <NumeroAlerta valor={usuario.criticos} />
                </Indicador>
                <Indicador rotulo="Vencidos">
                  <NumeroAlerta valor={usuario.vencidos} />
                </Indicador>
                <Indicador rotulo="Concluídas">{usuario.concluidas}</Indicador>
                <Indicador rotulo="% no prazo">
                  <PercentualPrazo usuario={usuario} />
                </Indicador>
                <Indicador rotulo="Tempo médio">{formatarHoras(usuario.tempo_medio_horas)}</Indicador>
              </div>
              <p className="text-[11px] text-white/40">Concluídas, % no prazo e tempo médio: últimos {dias} dias.</p>

              {erro ? (
                <p className="text-sm text-rose-300">Não foi possível carregar: {erro}</p>
              ) : !detalhe ? (
                <p className="text-sm text-white/55">Carregando...</p>
              ) : aba === "checklist" ? (
                <AbaChecklistRh
                  listas={detalhe.listas}
                  itens={detalhe.itens}
                  minimizadas={minimizadas}
                  selecionadoId={tarefaId}
                  onAbrirItem={(item) => setTarefaId(item.id)}
                />
              ) : aba === "concluidas" ? (
                <AbaConcluidasRh listas={detalhe.listas} itens={detalhe.itens} dias={dias} agora={agora} />
              ) : (
                <AbaEnviosRh envios={detalhe.envios} usuarioId={usuario.usuario_id} />
              )}
            </div>
          </div>

          {tarefa && (
            <aside className="flex min-h-0 w-full flex-col overflow-hidden bg-[#0b1224] lg:w-96 lg:shrink-0 lg:border-l lg:border-white/10">
              <DetalheTarefaLeitura
                item={tarefa}
                nomeLista={nomeLista}
                envios={detalhe?.envios ?? []}
                onFechar={() => setTarefaId(null)}
              />
            </aside>
          )}
        </div>
      </div>
    </Modal>
  );
}
