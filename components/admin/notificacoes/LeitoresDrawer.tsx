"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs } from "@/components/ui/Tabs";
import { formatarDataHoraSP } from "@/lib/datas";
import { corNivel, exigeConfirmacao, rotuloNivel } from "@/lib/notificacoes";
import { estatisticaLeitura, type DadosNotificacoes, type LeituraUsuario } from "@/lib/admin/notificacoes";
import type { Notificacao } from "@/lib/types/shell";

type Aba = "viram" | "nao-viram";

function ListaPessoas({ titulo, linhas, vazio }: { titulo?: string; linhas: LeituraUsuario[]; vazio: string }) {
  return (
    <div>
      {titulo && (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
          {titulo} ({linhas.length})
        </h3>
      )}
      {linhas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-sm text-white/45">{vazio}</p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
          {linhas.map(({ usuario, leitura }) => (
            <li key={usuario.id} className="flex items-center gap-3 px-3 py-2">
              <Avatar nome={usuario.nome} email={usuario.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{usuario.nome || usuario.email}</p>
                <p className="truncate text-xs text-white/45">{usuario.email}</p>
              </div>
              {leitura?.visto_em && (
                <div className="text-right text-xs text-white/55">
                  <p>Viu em {formatarDataHoraSP(leitura.visto_em)}</p>
                  {leitura.confirmado_em && <p className="text-emerald-300">Confirmou em {formatarDataHoraSP(leitura.confirmado_em)}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = { notificacao: Notificacao; dados: DadosNotificacoes; onClose: () => void };

export function LeitoresDrawer({ notificacao: n, dados, onClose }: Props) {
  const [aba, setAba] = useState<Aba>("viram");
  const est = estatisticaLeitura(n, dados);
  const viram = est.linhas.filter((l) => l.leitura?.visto_em);
  const naoViram = est.linhas.filter((l) => !l.leitura?.visto_em);
  const janela = exigeConfirmacao(n.formato);

  return (
    <Drawer open onClose={onClose} title="Leitores da notificação">
      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">{n.titulo}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <Badge variant={corNivel(n.nivel)}>{rotuloNivel(n.nivel)}</Badge>
            <span>
              {formatarDataHoraSP(n.inicio_em)} até {n.fim_em ? formatarDataHoraSP(n.fim_em) : "sem fim"}
            </span>
          </div>
        </div>

        <Tabs
          variant="underline"
          value={aba}
          onChange={setAba}
          items={[
            { id: "viram", label: `Viram (${viram.length})` },
            { id: "nao-viram", label: `Não viram (${naoViram.length})` },
          ]}
        />

        {aba === "viram" && !janela && <ListaPessoas linhas={viram} vazio="Ninguém viu ainda." />}
        {aba === "viram" && janela && (
          <div className="space-y-5">
            <ListaPessoas titulo="Confirmaram" linhas={viram.filter((l) => l.leitura?.confirmado_em)} vazio="Ninguém confirmou ainda." />
            <ListaPessoas titulo="Só viram" linhas={viram.filter((l) => !l.leitura?.confirmado_em)} vazio="Ninguém nesta situação." />
          </div>
        )}
        {aba === "nao-viram" && <ListaPessoas linhas={naoViram} vazio="Todo o público já viu." />}
      </div>
    </Drawer>
  );
}
