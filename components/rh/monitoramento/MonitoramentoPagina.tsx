"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { LinhaCards } from "@/components/ui/LinhaCards";
import { useToast } from "@/components/ui/Toast";
import { useAgora } from "@/hooks/useAgora";
import { PERIODOS_RH, carregarResumoRh, type PeriodoRh, type ResumoUsuarioRh } from "@/lib/rhMonitoramento";
import { calcularTotais, maisEmDia, pontosDeAtencao } from "@/lib/rhRegras";
import { NumerosRh } from "./NumerosRh";
import { MaisEmDiaCard, PontosAtencaoCard } from "./CardsRh";
import { TabelaUsuariosRh } from "./TabelaUsuariosRh";
import { UsuarioRhDrawer } from "./UsuarioRhDrawer";

const PERIODO_PADRAO: PeriodoRh = 30;

/** Monitoramento de tarefas do RH: somente leitura, dados só pelas RPCs rh_checklist_*. */
export function MonitoramentoPagina() {
  const toast = useToast();
  const agora = useAgora(60_000);
  const [dias, setDias] = useState<PeriodoRh>(PERIODO_PADRAO);
  const [resultado, setResultado] = useState<{ dias: PeriodoRh; lista: ResumoUsuarioRh[] } | null>(null);
  const [aberto, setAberto] = useState<ResumoUsuarioRh | null>(null);
  const usuarios = resultado?.dias === dias ? resultado.lista : null;

  useEffect(() => {
    let vivo = true;
    carregarResumoRh(dias)
      .then((lista) => vivo && setResultado({ dias, lista }))
      .catch((err) => {
        toast.error(`Erro ao carregar o monitoramento: ${err instanceof Error ? err.message : String(err)}`);
        if (vivo) setResultado({ dias, lista: [] });
      });
    return () => {
      vivo = false;
    };
  }, [dias, toast]);

  const totais = useMemo(() => (usuarios ? calcularTotais(usuarios, agora) : null), [usuarios, agora]);
  const pontos = useMemo(() => (usuarios ? pontosDeAtencao(usuarios, agora) : []), [usuarios, agora]);
  const ranking = useMemo(() => (usuarios ? maisEmDia(usuarios) : []), [usuarios]);
  // O detalhe acompanha o período escolhido sem fechar o Drawer.
  const abertoAtual = aberto ? usuarios?.find((u) => u.usuario_id === aberto.usuario_id) ?? aberto : null;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-4 text-white md:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monitoramento de tarefas</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
            <Eye className="h-4 w-4" /> Somente leitura · pessoas com acesso ao checklist (sem administradores)
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-white/65">
          Período
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value) as PeriodoRh)}
            className="rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {PERIODOS_RH.map((p) => (
              <option key={p} value={p}>
                Últimos {p} dias
              </option>
            ))}
          </select>
        </label>
      </header>

      {!usuarios || !totais ? (
        <p className="text-sm text-white/60">Carregando monitoramento...</p>
      ) : (
        <div className="space-y-6">
          <NumerosRh totais={totais} dias={dias} />
          <LinhaCards>
            <PontosAtencaoCard pontos={pontos} onAbrir={setAberto} />
            <MaisEmDiaCard ranking={ranking} onAbrir={setAberto} />
          </LinhaCards>
          <TabelaUsuariosRh usuarios={usuarios} agora={agora} onAbrir={setAberto} />
        </div>
      )}

      {abertoAtual && (
        <UsuarioRhDrawer
          key={abertoAtual.usuario_id}
          usuario={abertoAtual}
          dias={dias}
          agora={agora}
          onClose={() => setAberto(null)}
        />
      )}
    </main>
  );
}
