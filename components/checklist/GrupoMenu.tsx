"use client";

import { useRef, useState } from "react";
import { Archive, Ban, LogOut, MoreHorizontal, Pencil, Repeat, Send, Share2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { ChecklistCor, ChecklistGrupo } from "@/lib/types/shell";
import { GrupoModal } from "./GrupoModal";
import { RepetirListaModal } from "./RepetirListaModal";
import { SeletorCor } from "./SeletorCor";
import { ignorarRecolher } from "./TopoLista";
import { BotaoReenviarBase } from "./envios/BotaoReenviar";
import type { NovaRepeticaoLista } from "./repeticaoLista";

type Props = {
  grupo: ChecklistGrupo;
  /** Só o dono renomeia, troca a cor, compartilha e arquiva; o membro só pode sair. */
  dono: boolean;
  /** Tem membros: a confirmação de arquivar avisa que eles deixam de vê-la. */
  compartilhada: boolean;
  onRenomear: (nome: string) => Promise<boolean>;
  onCor: (cor: ChecklistCor) => void;
  onArquivar: () => Promise<boolean>;
  onCompartilhar: () => void;
  onSair: () => Promise<boolean>;
  /** Dono: repetição da lista inteira. O modal confirma desligar, mudar os dias e ligar com feitas antigas. */
  onRepetir: (nova: NovaRepeticaoLista) => Promise<boolean>;
  qtdConcluidasAntesDeHoje: number;
  envio: EnvioDaLista;
};

/** Envio da lista inteira (só o dono). Aguardando resposta, o menu só reenvia ou cancela. */
export type EnvioDaLista = {
  aguardando: { destino: string; ultimoEnvioEm: string } | null;
  /** Modo "todos": a lista segue editável mesmo com pendentes. */
  todos: boolean;
  /** Motivo de não poder enviar agora (ex.: tarefa com envio pendente); nulo quando pode. */
  bloqueio: string | null;
  onEnviar: () => void;
  onReenviar: () => Promise<boolean>;
  onCancelar: () => Promise<boolean>;
};

const OPCAO = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-superficie-hover";

export function GrupoMenu({
  grupo,
  dono,
  compartilhada,
  onRenomear,
  onCor,
  onArquivar,
  onCompartilhar,
  onSair,
  onRepetir,
  qtdConcluidasAntesDeHoje,
  envio,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [renomeando, setRenomeando] = useState(false);
  const [repetindo, setRepetindo] = useState(false);
  const [confirmando, setConfirmando] = useState<"arquivar" | "sair" | "cancelar-envio" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  // Guardado ao abrir a confirmação: o texto não muda enquanto o cancelamento termina.
  const [destinoCancelar, setDestinoCancelar] = useState("");
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  async function confirmar() {
    setOcupado(true);
    const ok = await (confirmando === "sair"
      ? onSair()
      : confirmando === "cancelar-envio"
        ? envio.onCancelar()
        : onArquivar());
    setOcupado(false);
    if (ok) setConfirmando(null);
  }

  const aviso =
    confirmando === "sair"
      ? {
          title: `Sair da lista "${grupo.nome}"?`,
          description: "A lista some da sua tela. Para voltar, o dono precisa compartilhar de novo.",
          confirmLabel: "Sair da lista",
          danger: true,
        }
      : confirmando === "cancelar-envio"
        ? {
            title: "Cancelar envio?",
            description: envio.todos
              ? `Só quem ainda não respondeu deixa de ver o pedido. Quem já aceitou fica com a cópia da lista "${grupo.nome}".`
              : `A lista "${grupo.nome}" deixa de aguardar resposta de ${destinoCancelar} e volta ao normal.`,
            confirmLabel: "Cancelar envio",
            danger: true,
          }
        : {
            title: `Arquivar a lista "${grupo.nome}"?`,
            description: `A lista some da tela, mas os itens dela ficam guardados.${
              compartilhada ? " Os membros desta lista deixam de vê-la enquanto estiver arquivada." : ""
            }`,
            confirmLabel: "Arquivar lista",
            danger: true,
          };

  const abrirDepois = (acao: () => void) => () => {
    fechar();
    acao();
  };

  return (
    <div ref={ref} className="relative" {...ignorarRecolher}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Opções da lista"
        aria-expanded={aberto}
        className="rounded-md p-1 text-texto/50 hover:bg-superficie-hover hover:text-texto"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 space-y-1 rounded-lg border border-borda bg-superficie-forte p-2 shadow-xl">
          {dono && envio.aguardando && !envio.todos ? (
            <>
              <BotaoReenviarBase
                ultimoEnvioEm={envio.aguardando.ultimoEnvioEm}
                reenviar={envio.onReenviar}
                textoOk="Lista reenviada."
                className={`${OPCAO} text-texto/85`}
                onFeito={fechar}
              />
              <button
                type="button"
                className={`${OPCAO} text-rose-300 hover:bg-rose-500/10`}
                onClick={abrirDepois(() => {
                  setDestinoCancelar(envio.aguardando?.destino ?? "");
                  setConfirmando("cancelar-envio");
                })}
              >
                <Ban className="h-4 w-4" /> Cancelar envio
              </button>
            </>
          ) : dono ? (
            <>
              <button type="button" className={`${OPCAO} text-texto/85`} onClick={abrirDepois(() => setRenomeando(true))}>
                <Pencil className="h-4 w-4" /> Renomear lista
              </button>
              <div className="px-2 py-1.5">
                <span className="mb-2 block text-xs text-texto-suave">Cor</span>
                <SeletorCor valor={grupo.cor} onChange={onCor} />
              </div>
              <button type="button" className={`${OPCAO} text-texto/85`} onClick={abrirDepois(onCompartilhar)}>
                <Share2 className="h-4 w-4" /> Compartilhar lista
              </button>
              {envio.aguardando && envio.todos && (
                <>
                  <BotaoReenviarBase
                    ultimoEnvioEm={envio.aguardando.ultimoEnvioEm}
                    reenviar={envio.onReenviar}
                    textoOk="Lista reenviada."
                    className={`${OPCAO} text-texto/85`}
                    onFeito={fechar}
                  />
                  <button
                    type="button"
                    className={`${OPCAO} text-rose-300 hover:bg-rose-500/10`}
                    onClick={abrirDepois(() => {
                      setDestinoCancelar(envio.aguardando?.destino ?? "");
                      setConfirmando("cancelar-envio");
                    })}
                  >
                    <Ban className="h-4 w-4" /> Cancelar envio
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={Boolean(envio.bloqueio) || Boolean(envio.aguardando)}
                title={envio.bloqueio ?? (envio.aguardando ? "Essa lista já tem um envio pendente" : undefined)}
                className={`${OPCAO} text-texto/85 disabled:cursor-not-allowed disabled:opacity-40`}
                onClick={abrirDepois(envio.onEnviar)}
              >
                <Send className="h-4 w-4" /> Enviar lista
              </button>
              <button type="button" className={`${OPCAO} text-texto/85`} onClick={abrirDepois(() => setRepetindo(true))}>
                <Repeat className="h-4 w-4" /> Repetir lista…
              </button>
              <button
                type="button"
                className={`${OPCAO} text-rose-300 hover:bg-rose-500/10`}
                onClick={abrirDepois(() => setConfirmando("arquivar"))}
              >
                <Archive className="h-4 w-4" /> Arquivar lista
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${OPCAO} text-rose-300 hover:bg-rose-500/10`}
              onClick={abrirDepois(() => setConfirmando("sair"))}
            >
              <LogOut className="h-4 w-4" /> Sair da lista
            </button>
          )}
        </div>
      )}

      {renomeando && (
        <GrupoModal
          titulo="Renomear lista"
          nomeInicial={grupo.nome}
          onSalvar={(nome) => (nome === grupo.nome ? Promise.resolve(true) : onRenomear(nome))}
          onClose={() => setRenomeando(false)}
        />
      )}

      {repetindo && (
        <RepetirListaModal
          grupo={grupo}
          qtdConcluidasAntesDeHoje={qtdConcluidasAntesDeHoje}
          onSalvar={onRepetir}
          onClose={() => setRepetindo(false)}
        />
      )}

      <ConfirmDialog
        open={confirmando !== null}
        title={aviso.title}
        description={aviso.description}
        confirmLabel={aviso.confirmLabel}
        danger={aviso.danger}
        loading={ocupado}
        onConfirm={confirmar}
        onCancel={() => setConfirmando(null)}
      />
    </div>
  );
}
