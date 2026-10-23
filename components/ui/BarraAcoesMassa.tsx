"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { ChevronUp, MoreHorizontal, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "./Button";

type OpcaoAcao = { id: string; rotulo: string; perigo?: boolean; onClick: () => void };

/** Ação direta (`onClick`) ou com variações escolhidas num menu (`opcoes`, ex.: Ligar/Desligar). */
export type AcaoMassa = {
  id: string;
  rotulo: string;
  icone?: ComponentType<{ className?: string }>;
  perigo?: boolean;
  onClick?: () => void;
  opcoes?: OpcaoAcao[];
};

const ITEM_MENU = "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-white/10";

type MenuProps = { rotulo: string; icone?: AcaoMassa["icone"]; children: (fechar: () => void) => ReactNode };

function Menu({ rotulo, icone: Icon, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  return (
    <div ref={ref} className="relative">
      <Button size="sm" variant="secondary" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {rotulo}
        <ChevronUp className={`h-3.5 w-3.5 transition-transform ${aberto ? "" : "rotate-180"}`} />
      </Button>
      {aberto && (
        <div className="absolute bottom-full left-0 z-30 mb-2 max-h-80 w-56 overflow-y-auto rounded-lg border border-white/15 bg-[#0f172a] p-1.5 shadow-xl">
          {children(fechar)}
        </div>
      )}
    </div>
  );
}

function ItensDaAcao({ acao, fechar }: { acao: AcaoMassa; fechar: () => void }) {
  const executar = (fn: () => void) => () => {
    fechar();
    fn();
  };
  if (!acao.opcoes) {
    return (
      <button type="button" className={`${ITEM_MENU} ${acao.perigo ? "text-rose-300" : "text-white/85"}`} onClick={executar(acao.onClick!)}>
        {acao.rotulo}
      </button>
    );
  }
  return (
    <>
      {acao.opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`${ITEM_MENU} ${o.perigo ? "text-rose-300" : "text-white/85"}`}
          onClick={executar(o.onClick)}
        >
          {o.rotulo}
        </button>
      ))}
    </>
  );
}

type Props = { total: number; acoes: AcaoMassa[]; onLimpar: () => void; ocupado?: boolean };

/** Barra fixa no rodapé da área com seleção: contador, ações e "Limpar seleção". No celular, as ações ficam num menu. */
export function BarraAcoesMassa({ total, acoes, onLimpar, ocupado = false }: Props) {
  const isMobile = useIsMobile();
  if (total === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Ações em massa"
      className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t border-blue-500/30 bg-[#0b1224]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] backdrop-blur"
    >
      <span className="mr-1 text-sm font-medium text-white">
        {total} {total === 1 ? "selecionado" : "selecionados"}
      </span>

      <fieldset disabled={ocupado} className="flex flex-wrap items-center gap-2 disabled:opacity-50">
        {isMobile ? (
          <Menu rotulo="Ações" icone={MoreHorizontal}>
            {(fechar) =>
              acoes.map((acao) => (
                <div key={acao.id} className="border-b border-white/5 py-1 last:border-0">
                  {acao.opcoes && <p className="px-2.5 pb-0.5 text-[11px] uppercase tracking-wide text-white/40">{acao.rotulo}</p>}
                  <ItensDaAcao acao={acao} fechar={fechar} />
                </div>
              ))
            }
          </Menu>
        ) : (
          acoes.map((acao) =>
            acao.opcoes ? (
              <Menu key={acao.id} rotulo={acao.rotulo} icone={acao.icone}>
                {(fechar) => <ItensDaAcao acao={acao} fechar={fechar} />}
              </Menu>
            ) : (
              <Button key={acao.id} size="sm" variant={acao.perigo ? "danger" : "secondary"} onClick={acao.onClick}>
                {acao.icone && <acao.icone className="h-3.5 w-3.5" />}
                {acao.rotulo}
              </Button>
            ),
          )
        )}
      </fieldset>

      <button
        type="button"
        onClick={onLimpar}
        className="ml-auto inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
      >
        <X className="h-3.5 w-3.5" /> Limpar seleção
      </button>
    </div>
  );
}
