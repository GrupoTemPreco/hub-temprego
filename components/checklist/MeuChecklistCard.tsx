"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ListChecks } from "lucide-react";
import { AcaoCard, CardRolavel, VazioCard } from "@/components/ui/CardRolavel";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { resumoPendentes } from "@/lib/checklistRegras";
import { rotaChecklist } from "@/lib/telaAtual";
import type { DadosChecklist } from "./useChecklistDados";
import { PrazoChip, UrgenciaChip } from "./ItemChips";

const LIMITE_ITENS = 6;

function Numero({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/3 px-3 py-1.5">
      <p className={`text-lg font-semibold leading-tight ${valor > 0 ? cor : "text-white/70"}`}>{valor}</p>
      <p className="text-xs text-white/50">{rotulo}</p>
    </div>
  );
}

/** Resumo do checklist no Início; os dados vêm da página (mesma carga usada por "Precisa da sua atenção"). */
export function MeuChecklistCard({ checklist }: { checklist: DadosChecklist }) {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const resumo = resumoPendentes(checklist.itens, LIMITE_ITENS);
  const abrir = (itemId?: string) => router.push(rotaChecklist(usuario.isAdmin, itemId), { scroll: false });

  return (
    <CardRolavel
      altura="360"
      titulo={
        <>
          <ListChecks className="h-4 w-4 text-cyan-300" />
          Meu checklist
        </>
      }
      acao={
        <AcaoCard onClick={() => abrir()}>
          Abrir checklist <ChevronRight className="h-3.5 w-3.5" />
        </AcaoCard>
      }
    >
      {checklist.carregando ? (
        <VazioCard>Carregando checklist...</VazioCard>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Numero rotulo="Pendentes" valor={resumo.total} cor="text-white" />
            <Numero rotulo="Críticos" valor={resumo.criticos} cor="text-rose-300" />
            <Numero rotulo="Vencendo" valor={resumo.vencendo} cor="text-amber-300" />
          </div>
          {resumo.total === 0 ? (
            <p className="py-4 text-center text-sm text-white/45">Nada pendente no seu checklist.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {resumo.destaques.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => abrir(item.id)}
                    className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm text-white/85 hover:bg-white/5"
                  >
                    <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
                    <UrgenciaChip urgencia={item.urgencia} />
                    {item.prazo && <PrazoChip prazo={item.prazo} feito={false} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </CardRolavel>
  );
}
