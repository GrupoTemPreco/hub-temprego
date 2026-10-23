"use client";

import { useEffect, useState, type UIEvent } from "react";
import { Activity, ShieldCheck, Ticket } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { tempoRelativo } from "@/lib/format";
import {
  ATIVIDADE_MAXIMO,
  ATIVIDADE_POR_PAGINA,
  carregarAtividadeRecente,
  type AtividadeItem,
} from "@/lib/admin/atividadeRecente";
import { CardRolavel } from "@/components/ui/CardRolavel";

const DISTANCIA_DO_FIM_PX = 120;

type Pagina = { itens: AtividadeItem[]; temMais: boolean; limite: number };

/** Carrega 20 itens e mais 20 ao chegar perto do fim da rolagem, até 200. */
export function AtividadeRecenteCard() {
  const toast = useToast();
  const [limite, setLimite] = useState(ATIVIDADE_POR_PAGINA);
  const [pagina, setPagina] = useState<Pagina | null>(null);
  const carregando = pagina?.limite !== limite;

  useEffect(() => {
    let ativo = true;
    carregarAtividadeRecente(limite)
      .then((r) => ativo && setPagina({ ...r, limite }))
      .catch((err) => {
        toast.error(`Erro ao carregar atividade: ${err instanceof Error ? err.message : String(err)}`);
        if (ativo) setPagina((prev) => ({ itens: prev?.itens ?? [], temMais: false, limite }));
      });
    return () => {
      ativo = false;
    };
  }, [limite, toast]);

  function aoRolar(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const pertoDoFim = el.scrollHeight - el.scrollTop - el.clientHeight < DISTANCIA_DO_FIM_PX;
    if (pertoDoFim && !carregando && pagina?.temMais) {
      setLimite((l) => Math.min(l + ATIVIDADE_POR_PAGINA, ATIVIDADE_MAXIMO));
    }
  }

  const itens = pagina?.itens ?? [];

  return (
    <CardRolavel
      titulo={
        <>
          <Activity className="h-4 w-4 text-emerald-400" />
          Atividade recente
        </>
      }
      onRolar={aoRolar}
    >
      {!pagina ? (
        <p className="text-sm text-white/55">Carregando atividade...</p>
      ) : itens.length === 0 ? (
        <EmptyState compact title="Nenhuma atividade ainda" description="As ações do admin e dos tickets aparecerão aqui." />
      ) : (
        <>
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-white/10">
            {itens.map((item) => {
              const Icon = item.origem === "admin" ? ShieldCheck : Ticket;
              const cor = item.origem === "admin" ? "bg-blue-500/20 text-blue-300" : "bg-violet-500/20 text-violet-300";
              return (
                <li key={item.id} className="relative flex gap-3">
                  <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cor}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm text-white/85">
                      <span className="font-medium text-white">{item.autor}</span> {item.frase}
                    </p>
                    <p className="text-xs text-white/45">{tempoRelativo(item.criadoEm)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {carregando && <p className="pt-3 text-center text-xs text-white/45">Carregando mais...</p>}
          {!carregando && !pagina.temMais && limite >= ATIVIDADE_MAXIMO && (
            <p className="pt-3 text-center text-xs text-white/35">Mostrando as {ATIVIDADE_MAXIMO} atividades mais recentes.</p>
          )}
        </>
      )}
    </CardRolavel>
  );
}
