"use client";

import { Badge } from "@/components/ui/Badge";
import { ESTILOS_NIVEL } from "@/components/notificacoes/estilosNivel";
import { useNotificacoesUsuario } from "@/components/notificacoes/NotificacoesUsuarioProvider";
import { formatarDataHoraSP } from "@/lib/datas";
import { corNivel, rotuloNivel } from "@/lib/notificacoes";
import type { Notificacao } from "@/lib/types/shell";

function periodo(n: Pick<Notificacao, "inicio_em" | "fim_em">) {
  const inicio = formatarDataHoraSP(n.inicio_em);
  return n.fim_em ? `De ${inicio} até ${formatarDataHoraSP(n.fim_em)}` : `Desde ${inicio}, sem data de término`;
}

/** Notificações ativas para a pessoa, de qualquer formato, inclusive as já fechadas. */
export function MuralAvisos() {
  const { ativas } = useNotificacoesUsuario();
  if (ativas.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Mural de avisos</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {ativas.map((n) => {
          const estilo = ESTILOS_NIVEL[n.nivel];
          const Icon = estilo.icone;
          return (
            <article key={n.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/3 p-4">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${estilo.iconeCor}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{n.titulo}</h3>
                  <Badge variant={corNivel(n.nivel)}>{rotuloNivel(n.nivel)}</Badge>
                </div>
                {n.mensagem && <p className="mt-1 whitespace-pre-line text-sm text-white/70">{n.mensagem}</p>}
                <p className="mt-2 text-xs text-white/40">{periodo(n)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
