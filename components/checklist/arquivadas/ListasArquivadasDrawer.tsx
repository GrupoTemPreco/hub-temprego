"use client";

import { useState } from "react";
import { Archive, ChevronRight, RotateCcw, Trash2, Users } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatarData } from "@/lib/format";
import { classeCorGrupo } from "@/lib/checklistOpcoes";
import type { ChecklistGrupo } from "@/lib/types/shell";
import { BlocoListaLeitura } from "../BlocoListaLeitura";
import type { ListasArquivadas } from "./useListasArquivadas";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

type LinhaProps = {
  lista: ChecklistGrupo;
  arquivadas: ListasArquivadas;
  ocupado: boolean;
  onExcluir: (lista: ChecklistGrupo) => void;
  onRestaurar: (lista: ChecklistGrupo) => void;
};

function LinhaArquivada({ lista, arquivadas, ocupado, onExcluir, onRestaurar }: LinhaProps) {
  const [aberta, setAberta] = useState(false);
  const itens = arquivadas.itensDe(lista);
  const pendentes = itens.filter((i) => i.status !== "feito").length;
  const compartilhada = Boolean(arquivadas.carga?.membros.some((m) => m.grupo_id === lista.id));

  return (
    <li className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
      <div className={`h-1.5 ${classeCorGrupo(lista.cor)}`} />
      <button type="button" onClick={() => setAberta((v) => !v)} aria-expanded={aberta} className="w-full px-3 py-2.5 text-left">
        <span className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${aberta ? "rotate-90" : ""}`} />
          <span className="min-w-0 flex-1 truncate font-semibold text-white">{lista.nome}</span>
          {compartilhada && (
            <Badge className="shrink-0 px-1.5 py-0 text-[11px]">
              <Users className="h-3 w-3" /> compartilhada
            </Badge>
          )}
        </span>
        <span className="mt-0.5 block pl-6 text-xs text-white/55">
          arquivada em {formatarData(lista.arquivado_em)} · {plural(pendentes, "pendente", "pendentes")} ·{" "}
          {plural(itens.length - pendentes, "concluído", "concluídos")}
        </span>
      </button>

      {aberta && (
        <div className="px-3 pb-3">
          <BlocoListaLeitura lista={lista} itens={itens} cabecalho={false} />
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-white/5 px-3 py-2">
        <Button size="sm" variant="ghost" className="text-rose-300 hover:text-rose-200" disabled={ocupado} onClick={() => onExcluir(lista)}>
          <Trash2 className="h-3.5 w-3.5" /> Excluir definitivamente
        </Button>
        <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => onRestaurar(lista)}>
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar
        </Button>
      </div>
    </li>
  );
}

type Props = { arquivadas: ListasArquivadas; onClose: () => void };

/** Listas arquivadas em que o usuário é dono, das mais recentes para as mais antigas. */
export function ListasArquivadasDrawer({ arquivadas, onClose }: Props) {
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<ChecklistGrupo | null>(null);
  const listas = arquivadas.carga?.listas ?? [];

  async function executar(lista: ChecklistGrupo, acao: () => Promise<unknown>) {
    setOcupadoId(lista.id);
    try {
      await acao();
    } finally {
      setOcupadoId(null);
    }
  }

  return (
    <Drawer open onClose={onClose} title="Listas arquivadas" width="max-w-xl">
      {!arquivadas.carga ? (
        <p className="p-5 text-sm text-white/55">Carregando...</p>
      ) : listas.length === 0 ? (
        <EmptyState icon={Archive} title="Nenhuma lista arquivada" />
      ) : (
        <ul className="space-y-3 p-5">
          {listas.map((lista) => (
            <LinhaArquivada
              key={lista.id}
              lista={lista}
              arquivadas={arquivadas}
              ocupado={ocupadoId === lista.id}
              onRestaurar={(l) => void executar(l, () => arquivadas.restaurar(l))}
              onExcluir={(l) =>
                void executar(l, async () => {
                  if (await arquivadas.podeExcluir(l)) setExcluindo(l);
                })
              }
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={excluindo !== null}
        danger
        title={`Excluir a lista "${excluindo?.nome ?? ""}" definitivamente?`}
        description={
          excluindo &&
          `${plural(arquivadas.itensDe(excluindo).length, "item será apagado", "itens serão apagados")} junto. Não dá para desfazer.`
        }
        confirmLabel="Excluir definitivamente"
        loading={excluindo !== null && ocupadoId === excluindo.id}
        onConfirm={() =>
          excluindo &&
          void executar(excluindo, async () => {
            if (await arquivadas.excluir(excluindo)) setExcluindo(null);
          })
        }
        onCancel={() => setExcluindo(null)}
      />
    </Drawer>
  );
}
