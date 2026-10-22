"use client";

import { Copy, Pencil, Play, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatarDataHoraSP } from "@/lib/datas";
import {
  corNivel,
  exigeConfirmacao,
  podeReativarNotificacao,
  rotuloFormato,
  rotuloNivel,
  rotuloPublico,
  rotuloTelas,
  situacaoNotificacao,
} from "@/lib/notificacoes";
import { estatisticaLeitura, type DadosNotificacoes } from "@/lib/admin/notificacoes";
import type { Notificacao } from "@/lib/types/shell";
import { BarraLeitura } from "./BarraLeitura";

export type AcaoNotificacao = "editar" | "duplicar" | "encerrar" | "reativar" | "excluir" | "leitores";

type Props = {
  notificacoes: Notificacao[];
  dados: DadosNotificacoes;
  onAcao: (acao: AcaoNotificacao, n: Notificacao) => void;
};

const BOTAO = "rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white";

export function NotificacoesTabela({ notificacoes, dados, onAcao }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-3 font-medium">Título</th>
            <th className="px-3 py-3 font-medium">Nível</th>
            <th className="px-3 py-3 font-medium">Público</th>
            <th className="px-3 py-3 font-medium">Onde aparece</th>
            <th className="px-3 py-3 font-medium">Formato</th>
            <th className="px-3 py-3 font-medium">Período</th>
            <th className="px-3 py-3 font-medium">Leitura</th>
            <th className="px-3 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {notificacoes.map((n) => {
            const est = estatisticaLeitura(n, dados);
            const situacao = situacaoNotificacao(n);
            return (
              <tr key={n.id} className="border-b border-white/5 hover:bg-white/3">
                <td className="max-w-65 px-3 py-3">
                  <button onClick={() => onAcao("leitores", n)} className="block max-w-full text-left">
                    <span className="block truncate font-medium hover:underline">{n.titulo}</span>
                    <span className="block truncate text-xs text-white/50">{n.mensagem}</span>
                  </button>
                </td>
                <td className="px-3 py-3">
                  <Badge variant={corNivel(n.nivel)}>{rotuloNivel(n.nivel)}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-white/70">{rotuloPublico(n)}</td>
                <td className="max-w-40 truncate px-3 py-3 text-white/70" title={rotuloTelas(n.modulos)}>
                  {rotuloTelas(n.modulos)}
                </td>
                <td className="px-3 py-3 text-white/70">{rotuloFormato(n.formato)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-white/60">
                  <span className="block">{formatarDataHoraSP(n.inicio_em)}</span>
                  <span className="block text-white/40">até {n.fim_em ? formatarDataHoraSP(n.fim_em) : "sem fim"}</span>
                </td>
                <td className="px-3 py-3">
                  <BarraLeitura
                    lidos={est.lidos}
                    total={est.total}
                    confirmacao={exigeConfirmacao(n.formato)}
                    onClick={() => onAcao("leitores", n)}
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex gap-0.5">
                    <button className={BOTAO} title="Editar" onClick={() => onAcao("editar", n)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className={BOTAO} title="Duplicar como nova" onClick={() => onAcao("duplicar", n)}>
                      <Copy className="h-4 w-4" />
                    </button>
                    {situacao !== "encerrada" && (
                      <button className={`${BOTAO} hover:text-amber-300`} title="Encerrar agora" onClick={() => onAcao("encerrar", n)}>
                        <Square className="h-4 w-4" />
                      </button>
                    )}
                    {podeReativarNotificacao(n) && (
                      <button className={`${BOTAO} hover:text-emerald-300`} title="Reativar" onClick={() => onAcao("reativar", n)}>
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button className={`${BOTAO} hover:text-rose-300`} title="Excluir" onClick={() => onAcao("excluir", n)}>
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
  );
}
