"use client";

import { formatarData, formatarTamanho } from "@/lib/format";
import type { AnexoExibicao } from "@/hooks/useAnexosTicket";
import { IconeArquivo } from "./IconeArquivo";

type Props = {
  anexos: AnexoExibicao[];
  onAbrirImagem: (anexoId: string) => void;
};

/**
 * Miniaturas das imagens (abrem no lightbox), chips dos demais arquivos (baixam ao clicar)
 * e chips apagados, sem link, dos anexos removidos na limpeza.
 */
export function AnexosExibicao({ anexos, onAbrirImagem }: Props) {
  if (anexos.length === 0) return null;
  const imagens = anexos.filter((a) => a.imagem && !a.removido);
  const arquivos = anexos.filter((a) => !a.imagem && !a.removido);
  const removidos = anexos.filter((a) => a.removido);

  return (
    <div className="mt-2 space-y-2">
      {imagens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagens.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onAbrirImagem(a.id)}
              title={a.nome_arquivo}
              className="h-20 w-20 overflow-hidden rounded-md border border-borda bg-superficie transition-opacity hover:opacity-80"
            >
              {a.url ? (
                <img src={a.url} alt={a.nome_arquivo} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-texto/40">Indisponível</span>
              )}
            </button>
          ))}
        </div>
      )}

      {arquivos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {arquivos.map((a) => (
            <a
              key={a.id}
              href={a.url ?? undefined}
              title={`Baixar ${a.nome_arquivo}`}
              className={`inline-flex max-w-full items-center gap-2 rounded-md border border-borda bg-superficie px-2.5 py-1.5 text-xs ${
                a.url ? "hover:bg-superficie-hover" : "pointer-events-none opacity-50"
              }`}
            >
              <IconeArquivo tipo={a.tipo_mime} className="h-4 w-4 shrink-0" />
              <span className="max-w-55 truncate text-texto/85">{a.nome_arquivo}</span>
              <span className="shrink-0 text-texto/40">{formatarTamanho(a.tamanho_bytes)}</span>
            </a>
          ))}
        </div>
      )}

      {removidos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {removidos.map((a) => (
            <span
              key={a.id}
              className="inline-flex max-w-full items-center gap-2 rounded-md border border-dashed border-borda px-2.5 py-1.5 text-xs text-texto-fraco"
            >
              <IconeArquivo tipo={a.tipo_mime} className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate line-through decoration-texto-fraco">{a.nome_arquivo}</span>
              <span className="shrink-0">– removido na limpeza em {formatarData(a.removido_em)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
