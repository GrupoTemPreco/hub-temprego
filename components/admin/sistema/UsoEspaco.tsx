"use client";

import { useEffect, useState } from "react";
import { Database, FolderOpen, HardDrive, Paperclip, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { StatCard } from "@/components/admin/visao-geral/StatCard";
import { formatarData, formatarTamanho } from "@/lib/format";
import {
  bytesDoBucketAnexos,
  carregarLimitesPlano,
  carregarMaioresAnexos,
  carregarUsoArmazenamento,
  totalArquivosStorage,
  totalBytesStorage,
  type AnexoGrande,
  type LimitesPlano,
  type UsoArmazenamento,
} from "@/lib/admin/armazenamento";
import { CardLimite } from "./CardLimite";

type Dados = { uso: UsoArmazenamento; maiores: AnexoGrande[]; limites: LimitesPlano };

const SUBTITULO = "mb-2 text-xs font-semibold uppercase tracking-wide text-white/45";

function BarrasSchemas({ schemas }: { schemas: UsoArmazenamento["schemas"] }) {
  const ordenados = [...schemas].sort((a, b) => b.bytes - a.bytes);
  const maior = Math.max(1, ...ordenados.map((s) => Number(s.bytes)));
  return (
    <ul className="space-y-2">
      {ordenados.map((s) => (
        <li key={s.schema} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="truncate font-mono text-white/75">{s.schema}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/5">
            <span className="block h-full rounded-full bg-cyan-500/70" style={{ width: `${(Number(s.bytes) / maior) * 100}%` }} />
          </span>
          <span className="text-right text-xs text-white/55">{formatarTamanho(Number(s.bytes))}</span>
        </li>
      ))}
    </ul>
  );
}

function TabelasShell({ tabelas }: { tabelas: UsoArmazenamento["tabelas_shell"] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
        <tr>
          <th className="py-2 pr-3 font-medium">Tabela</th>
          <th className="py-2 pr-3 text-right font-medium">Tamanho</th>
          <th className="py-2 text-right font-medium">Linhas</th>
        </tr>
      </thead>
      <tbody>
        {[...tabelas]
          .sort((a, b) => b.bytes - a.bytes)
          .map((t) => (
            <tr key={t.tabela} className="border-b border-white/5">
              <td className="py-1.5 pr-3 font-mono text-white/80">{t.tabela}</td>
              <td className="py-1.5 pr-3 text-right text-white/65">{formatarTamanho(Number(t.bytes))}</td>
              <td className="py-1.5 text-right text-white/65">{Number(t.linhas).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

type Props = {
  /** Muda depois de uma limpeza, para recarregar. */
  versao: number;
  onAbrirTicket: (numero: number) => void;
};

export function UsoEspaco({ versao, onAbrirTicket }: Props) {
  const toast = useToast();
  const [dados, setDados] = useState<Dados | null>(null);
  const [atualizacoes, setAtualizacoes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    Promise.all([carregarUsoArmazenamento(), carregarMaioresAnexos(), carregarLimitesPlano()])
      .then(([uso, maiores, limites]) => ativo && setDados({ uso, maiores, limites }))
      .catch((err) => toast.error(`Erro ao carregar o uso de espaço: ${err instanceof Error ? err.message : String(err)}`))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [versao, atualizacoes, toast]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Uso de espaço</h2>
        <Button
          size="sm"
          variant="secondary"
          disabled={carregando}
          onClick={() => {
            setCarregando(true);
            setAtualizacoes((n) => n + 1);
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {!dados ? (
        <p className="text-sm text-white/55">{carregando ? "Carregando uso de espaço..." : "Não foi possível carregar."}</p>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="grid gap-4 sm:grid-cols-3">
              <CardLimite
                titulo="Banco de dados"
                icon={Database}
                usadoBytes={dados.uso.banco_total_bytes}
                limiteGb={dados.limites.bancoGb}
              />
              <CardLimite
                titulo="Arquivos no Storage"
                icon={FolderOpen}
                usadoBytes={totalBytesStorage(dados.uso)}
                limiteGb={dados.limites.storageGb}
                detalhe={`${totalArquivosStorage(dados.uso).toLocaleString("pt-BR")} arquivos em ${dados.uso.buckets.length} buckets`}
              />
              <StatCard
                titulo="Bucket tickets-anexos"
                valor={formatarTamanho(bytesDoBucketAnexos(dados.uso))}
                legenda="Anexos dos tickets"
                icon={HardDrive}
                cor="green"
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Valores aproximados. O número oficial de cobrança está no painel do Supabase (Usage).
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <h3 className={SUBTITULO}>Espaço por schema</h3>
              <BarrasSchemas schemas={dados.uso.schemas} />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <h3 className={SUBTITULO}>Tabelas do schema shell</h3>
              <TabelasShell tabelas={dados.uso.tabelas_shell} />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <h3 className={SUBTITULO}>10 maiores anexos de tickets</h3>
            {dados.maiores.length === 0 ? (
              <p className="text-sm text-white/45">Nenhum anexo armazenado.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {dados.maiores.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-white/40" />
                    <span className="min-w-0 flex-1 truncate text-white/85">{a.nome_arquivo}</span>
                    <span className="shrink-0 text-white/60">{formatarTamanho(a.tamanho_bytes)}</span>
                    {a.ticket ? (
                      <button
                        onClick={() => onAbrirTicket(a.ticket!.numero)}
                        className="shrink-0 font-mono text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                      >
                        #{a.ticket.numero}
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-white/35">—</span>
                    )}
                    <span className="w-20 shrink-0 text-right text-xs text-white/45">{formatarData(a.criado_em)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
