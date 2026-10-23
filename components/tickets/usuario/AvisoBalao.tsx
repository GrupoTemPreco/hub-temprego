"use client";

import { History, ListChecks, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Linha de um aviso agrupado, com o seu próprio "Abrir" (ex.: "Enquanto você estava fora"). */
export type LinhaAviso = { chave: string; texto: string; onAbrir: () => void };

/** O que o cartão exibe; vem dos avisos de tickets, do checklist ou do resumo de ausência (useAvisosDoBalao). */
export type AvisoCartao = {
  /** Estável enquanto o cartão é o mesmo: "tempo-real", "lembrete" ou "ausencia". */
  chave: string;
  origem: "tickets" | "checklist" | "ausencia";
  titulo: string;
  detalhe?: string;
  /** Corta o detalhe em uma linha (título do ticket). */
  detalheCortado?: boolean;
  /** Com linhas, cada uma tem o seu "Abrir" e o rodapé fica só com "Ok". */
  linhas?: LinhaAviso[];
};

type Props = {
  aviso: AvisoCartao;
  /** Abre o ticket (ou o balão em Recebidos) e dispensa o aviso. Sem uso quando o aviso tem linhas. */
  onAbrir?: () => void;
  /** Só dispensa o aviso ("Ok" e X). */
  onDispensar: () => void;
  /** Só o cartão mais perto do balão mostra a setinha. */
  comSeta?: boolean;
};

const ICONES = { tickets: MessageSquare, checklist: ListChecks, ausencia: History };

/** Cartão pequeno acima do balão; a pilha (posição fixa) fica em BalaoTickets. */
export function AvisoBalao({ aviso, onAbrir, onDispensar, comSeta = true }: Props) {
  const Icone = ICONES[aviso.origem];
  return (
    <div role="status" aria-live="polite" className="motion-safe:animate-surgir">
      <div className="relative rounded-xl border border-blue-400/40 bg-[#0b1224] shadow-2xl">
        <div className="flex items-start gap-2.5 p-3 pr-9">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
            <Icone className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">{aviso.titulo}</span>
            {aviso.detalhe && (
              <span className={`mt-0.5 block text-xs text-white/60 ${aviso.detalheCortado ? "truncate" : ""}`}>
                {aviso.detalhe}
              </span>
            )}
          </span>
        </div>
        {aviso.linhas && (
          <ul className="space-y-1 px-3 pb-2">
            {aviso.linhas.map((l) => (
              <li key={l.chave} className="flex items-center gap-2 rounded-md bg-white/3 py-1 pl-2 pr-1 text-xs text-white/80">
                <span className="min-w-0 flex-1 truncate" title={l.texto}>
                  {l.texto}
                </span>
                <button
                  type="button"
                  onClick={l.onAbrir}
                  className="shrink-0 rounded px-1.5 py-0.5 font-medium text-blue-300 hover:bg-white/10 hover:text-blue-200"
                >
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 px-3 pb-3">
          <Button size="sm" variant="secondary" onClick={onDispensar}>
            Ok
          </Button>
          {!aviso.linhas && onAbrir && (
            <Button size="sm" onClick={onAbrir}>
              Abrir
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={onDispensar}
          aria-label="Dispensar aviso"
          className="absolute right-1.5 top-1.5 rounded p-1 text-white/45 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {comSeta && (
          <span
            aria-hidden
            className="absolute -bottom-1.5 right-5.5 h-3 w-3 rotate-45 border-b border-r border-blue-400/40 bg-[#0b1224]"
          />
        )}
      </div>
    </div>
  );
}
