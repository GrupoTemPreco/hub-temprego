"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const ATRASO_PADRAO = 300;
const MARGEM = 8;
const LARGURA_MAXIMA = 360;
/** Abaixo disso não cabe por cima: o balão vai para baixo do texto. */
const ESPACO_ACIMA = 72;

function estaCortado(el: HTMLElement) {
  return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
}

function posicaoDe(el: HTMLElement): CSSProperties {
  const r = el.getBoundingClientRect();
  const left = Math.max(MARGEM, Math.min(r.left, window.innerWidth - LARGURA_MAXIMA - MARGEM));
  return r.top > ESPACO_ACIMA ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 };
}

type Props = {
  conteudo: ReactNode;
  children: ReactNode;
  /** Elemento que recebe o hover e é medido (ex.: o próprio span com `truncate`). */
  as?: ElementType;
  className?: string;
  /** Só abre quando o texto do elemento está cortado (reticências ou limite de linhas). */
  somenteSeCortado?: boolean;
  atraso?: number;
};

/**
 * Balão no hover do mouse. Fica fora do fluxo (portal) e sem eventos de ponteiro,
 * então não interfere no clique nem no arrasto; some ao pressionar ou rolar.
 */
export function Tooltip({
  conteudo,
  children,
  as: Elemento = "span",
  className,
  somenteSeCortado = false,
  atraso = ATRASO_PADRAO,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [posicao, setPosicao] = useState<CSSProperties | null>(null);
  const id = useId();

  function cancelar() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function esconder() {
    cancelar();
    setPosicao(null);
  }

  function agendar(evento: PointerEvent<HTMLElement>) {
    // Toque não tem hover; botão pressionado é arrasto em andamento.
    if (evento.pointerType !== "mouse" || evento.buttons !== 0 || timer.current || posicao) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      const el = ref.current;
      if (!el || (somenteSeCortado && !estaCortado(el))) return;
      setPosicao(posicaoDe(el));
    }, atraso);
  }

  useEffect(() => {
    if (!posicao) return;
    const fechar = () => setPosicao(null);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("pointerdown", fechar, true);
    window.addEventListener("dragstart", fechar, true);
    window.addEventListener("blur", fechar);
    return () => {
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("pointerdown", fechar, true);
      window.removeEventListener("dragstart", fechar, true);
      window.removeEventListener("blur", fechar);
    };
  }, [posicao]);

  useEffect(() => cancelar, []);

  return (
    <>
      <Elemento
        ref={ref}
        className={className}
        aria-describedby={posicao ? id : undefined}
        onPointerEnter={agendar}
        onPointerMove={agendar}
        onPointerLeave={esconder}
        onPointerDown={esconder}
      >
        {children}
      </Elemento>
      {posicao &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ ...posicao, maxWidth: `min(${LARGURA_MAXIMA}px, calc(100vw - ${MARGEM * 2}px))` }}
            className="pointer-events-none fixed z-[70] whitespace-pre-wrap break-words rounded-md border border-white/15 bg-[#0f172a] px-2.5 py-1.5 text-xs font-medium text-white/90 shadow-xl"
          >
            {conteudo}
          </div>,
          document.body,
        )}
    </>
  );
}

type TextoCortadoProps = {
  children: string;
  as?: ElementType;
  className?: string;
};

/** Texto com `truncate` ou `line-clamp-*` que mostra a versão inteira no hover, só quando cortado. */
export function TextoCortado({ children, as, className }: TextoCortadoProps) {
  return (
    <Tooltip conteudo={children} as={as} className={className} somenteSeCortado>
      {children}
    </Tooltip>
  );
}
