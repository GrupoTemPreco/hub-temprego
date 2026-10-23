"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
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

/** Detalhe em leitura (nenhuma ação de edição). No celular o Drawer ocupa a tela inteira. */
export function UsuarioRhDrawer({ usuario, dias, agora, onClose }: Props) {
  const [aba, setAba] = useState<Aba>("checklist");
  const [detalhe, setDetalhe] = useState<DetalheUsuarioRh | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    carregarDetalheRh(usuario.usuario_id)
      .then((d) => vivo && setDetalhe(d))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : String(err)));
    return () => {
      vivo = false;
    };
  }, [usuario.usuario_id]);

  return (
    <Drawer open onClose={onClose} title="Monitoramento · detalhe" width="max-w-5xl">
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar nome={usuario.nome} email={usuario.email} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-lg font-semibold">{usuario.nome || usuario.email}</p>
            {usuario.nome && <p className="truncate text-sm text-white/55">{usuario.email}</p>}
            <SetoresChips setores={usuario.setores} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
          <Indicador rotulo="Último acesso ao hub">
            <AcessoRelativo iso={usuario.ultimo_acesso_em} agora={agora} />
          </Indicador>
          <Indicador rotulo="Último acesso ao checklist">
            <AcessoRelativo iso={usuario.ultimo_acesso_checklist_em} agora={agora} alertar />
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

        <Tabs items={ABAS} value={aba} onChange={setAba} variant="underline" />

        {erro ? (
          <p className="text-sm text-rose-300">Não foi possível carregar: {erro}</p>
        ) : !detalhe ? (
          <p className="text-sm text-white/55">Carregando...</p>
        ) : aba === "checklist" ? (
          <AbaChecklistRh listas={detalhe.listas} itens={detalhe.itens} />
        ) : aba === "concluidas" ? (
          <AbaConcluidasRh listas={detalhe.listas} itens={detalhe.itens} dias={dias} agora={agora} />
        ) : (
          <AbaEnviosRh envios={detalhe.envios} usuarioId={usuario.usuario_id} />
        )}
      </div>
    </Drawer>
  );
}
