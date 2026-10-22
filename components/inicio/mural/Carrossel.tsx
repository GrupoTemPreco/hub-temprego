"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { id: string; conteudo: ReactNode };

type Props = {
  itens: Item[];
  rotulo: string;
  intervaloMs?: number;
};

const LARGURA_ITEM = "flex w-[85vw] shrink-0 snap-start sm:w-95";
const SETA =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b1224]/90 text-white/80 shadow-lg transition-opacity hover:text-white disabled:pointer-events-none disabled:opacity-0";

/**
 * Carrossel horizontal com encaixe, setas, bolinhas e avanço automático.
 * O avanço pausa com mouse, foco, toque ou aba oculta; no fim, volta ao início.
 */
export function Carrossel({ itens, rotulo, intervaloMs = 8000 }: Props) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [transborda, setTransborda] = useState(false);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);
  const [mouse, setMouse] = useState(false);
  const [foco, setFoco] = useState(false);
  const [toque, setToque] = useState(false);
  const [abaVisivel, setAbaVisivel] = useState(true);

  const medir = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const maximo = el.scrollWidth - el.clientWidth;
    const filhos = Array.from(el.children) as HTMLElement[];
    const base = filhos[0]?.offsetLeft ?? 0;
    let maisPerto = 0;
    filhos.forEach((f, i) => {
      if (Math.abs(f.offsetLeft - base - el.scrollLeft) < Math.abs(filhos[maisPerto].offsetLeft - base - el.scrollLeft)) {
        maisPerto = i;
      }
    });
    const fim = el.scrollLeft >= maximo - 1;
    setTransborda(maximo > 1);
    setNoInicio(el.scrollLeft <= 1);
    setNoFim(fim);
    setIndice(fim && maximo > 1 ? filhos.length - 1 : maisPerto);
  }, []);

  const irPara = useCallback((i: number) => {
    const el = trilhoRef.current;
    const filhos = el ? (Array.from(el.children) as HTMLElement[]) : [];
    if (!el || !filhos[i]) return;
    el.scrollTo({ left: filhos[i].offsetLeft - filhos[0].offsetLeft, behavior: "smooth" });
  }, []);

  // Mede quando o trilho ou os cards mudam de tamanho (inclui a primeira medição).
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    Array.from(el.children).forEach((filho) => observador.observe(filho));
    return () => observador.disconnect();
  }, [medir, itens.length]);

  useEffect(() => {
    const aoMudar = () => setAbaVisivel(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", aoMudar);
    return () => document.removeEventListener("visibilitychange", aoMudar);
  }, []);

  const avancar = transborda && abaVisivel && !mouse && !foco && !toque;
  useEffect(() => {
    if (!avancar) return;
    const id = setTimeout(() => irPara(noFim ? 0 : indice + 1), intervaloMs);
    return () => clearTimeout(id);
  }, [avancar, indice, noFim, intervaloMs, irPara]);

  if (itens.length === 1) return <div className={LARGURA_ITEM}>{itens[0].conteudo}</div>;

  return (
    <div
      className="relative"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      onMouseEnter={() => setMouse(true)}
      onMouseLeave={() => setMouse(false)}
      onFocus={() => setFoco(true)}
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false);
      }}
      onTouchStart={() => setToque(true)}
      onTouchEnd={() => setToque(false)}
      onTouchCancel={() => setToque(false)}
    >
      <div ref={trilhoRef} onScroll={medir} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {itens.map((item) => (
          <div key={item.id} className={LARGURA_ITEM}>
            {item.conteudo}
          </div>
        ))}
      </div>

      {transborda && (
        <>
          <button
            type="button"
            onClick={() => irPara(Math.max(0, indice - 1))}
            disabled={noInicio}
            aria-label="Aviso anterior"
            className={`${SETA} -left-3`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => irPara(Math.min(itens.length - 1, indice + 1))}
            disabled={noFim}
            aria-label="Próximo aviso"
            className={`${SETA} -right-3`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-2 flex justify-center gap-1.5">
            {itens.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o aviso ${i + 1}`}
                aria-current={i === indice}
                className={`h-2 rounded-full transition-all ${i === indice ? "w-5 bg-cyan-400" : "w-2 bg-white/25 hover:bg-white/45"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
