"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ESTILOS_NIVEL } from "@/components/notificacoes/estilosNivel";
import { formatarDataHoraSP } from "@/lib/datas";
import { corNivel, rotuloNivel } from "@/lib/notificacoes";
import type { Notificacao } from "@/lib/types/shell";

function periodo(n: Pick<Notificacao, "inicio_em" | "fim_em">) {
  const inicio = formatarDataHoraSP(n.inicio_em);
  return n.fim_em ? `De ${inicio} até ${formatarDataHoraSP(n.fim_em)}` : `Desde ${inicio}, sem data de término`;
}

/** Aviso do mural: mensagem cortada em 4 linhas, com "Ler mais" abrindo o texto completo. */
export function CardAviso({ notificacao: n }: { notificacao: Notificacao }) {
  const estilo = ESTILOS_NIVEL[n.nivel];
  const Icon = estilo.icone;
  const textoRef = useRef<HTMLParagraphElement>(null);
  const [cortado, setCortado] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const el = textoRef.current;
    if (!el) return;
    const observador = new ResizeObserver(() => setCortado(el.scrollHeight > el.clientHeight + 1));
    observador.observe(el);
    return () => observador.disconnect();
  }, [n.mensagem]);

  return (
    <article className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/3 p-4">
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${estilo.iconeCor}`} />
        <h3 className="line-clamp-2 min-w-0 flex-1 font-semibold text-white">{n.titulo}</h3>
        <Badge variant={corNivel(n.nivel)}>{rotuloNivel(n.nivel)}</Badge>
      </div>
      {n.mensagem && (
        <p ref={textoRef} className="line-clamp-4 whitespace-pre-line text-sm text-white/70">
          {n.mensagem}
        </p>
      )}
      {cortado && (
        <button type="button" onClick={() => setAberto(true)} className="self-start text-xs font-medium text-cyan-300 hover:text-cyan-200">
          Ler mais
        </button>
      )}
      <p className="mt-auto pt-1 text-xs text-white/40">{periodo(n)}</p>

      <Modal open={aberto} onClose={() => setAberto(false)} title={n.titulo}>
        <div className="space-y-3">
          <Badge variant={corNivel(n.nivel)}>{rotuloNivel(n.nivel)}</Badge>
          <p className="whitespace-pre-line text-sm text-white/80">{n.mensagem}</p>
          <p className="text-xs text-white/45">{periodo(n)}</p>
        </div>
      </Modal>
    </article>
  );
}
