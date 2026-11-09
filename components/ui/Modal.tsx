"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

type Tamanho = "sm" | "md" | "lg" | "xl" | "painel";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Faixa fixa no lugar do título. O X continua à direita. Usado no tamanho `painel`. */
  cabecalho?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: Tamanho;
  /** Limita a altura do conteúdo à tela e ativa a rolagem interna. Ignorado no tamanho `painel`. */
  rolavel?: boolean;
  /** Impede a página de trás de rolar. O tamanho `painel` já trava. */
  travarRolagem?: boolean;
};

const LARGURAS: Record<Exclude<Tamanho, "painel">, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
};

const CLASSE_PAINEL =
  "flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-superficie-forte shadow-2xl md:h-[90vh] md:max-h-[90vh] md:w-[92vw] md:max-w-[1400px] md:rounded-xl md:border md:border-borda";

function useTravarFundo(ativo: boolean, origem: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ativo) return;
    const guardados: { el: HTMLElement; overflow: string }[] = [];
    let el = origem.current?.parentElement ?? null;
    while (el) {
      const eixo = getComputedStyle(el).overflowY;
      if (eixo === "auto" || eixo === "scroll") {
        guardados.push({ el, overflow: el.style.overflowY });
        el.style.overflowY = "hidden";
      }
      el = el.parentElement;
    }
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      for (const item of guardados) item.el.style.overflowY = item.overflow;
      document.body.style.overflow = anterior;
    };
  }, [ativo, origem]);
}

function BotaoFechar({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fechar"
      className="shrink-0 rounded-md p-1 text-texto/50 hover:bg-superficie-hover hover:text-texto"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  cabecalho,
  children,
  footer,
  size = "md",
  rolavel = false,
  travarRolagem,
}: ModalProps) {
  const fundoRef = useRef<HTMLDivElement>(null);
  const painel = size === "painel";
  useEscapeKey(open, onClose);
  useTravarFundo(open && (travarRolagem ?? painel), fundoRef);

  if (!open) return null;

  return (
    <div
      ref={fundoRef}
      className={
        painel
          ? "fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm md:items-center md:justify-center"
          : "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      }
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={
          painel
            ? CLASSE_PAINEL
            : `w-full ${LARGURAS[size]} rounded-xl border border-borda bg-superficie-forte shadow-2xl`
        }
      >
        {painel ? (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-borda px-5 py-3">
            <div className="min-w-0 flex-1">{cabecalho ?? (title && <h2 className="text-base font-semibold text-texto">{title}</h2>)}</div>
            <BotaoFechar onClose={onClose} />
          </div>
        ) : (
          title && (
            <div className="flex items-center justify-between border-b border-borda px-5 py-4">
              <h2 className="text-base font-semibold text-texto">{title}</h2>
              <BotaoFechar onClose={onClose} />
            </div>
          )
        )}
        <div
          className={
            painel
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : `px-5 py-4 ${rolavel ? "max-h-[calc(100vh-11rem)] overflow-y-auto" : ""}`
          }
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-borda px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
