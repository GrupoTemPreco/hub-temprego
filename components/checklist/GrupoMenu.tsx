"use client";

import { useRef, useState } from "react";
import { Archive, LogOut, MoreHorizontal, Pencil, Repeat, Share2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toggle } from "@/components/ui/Toggle";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { ChecklistCor, ChecklistGrupo } from "@/lib/types/shell";
import { GrupoModal } from "./GrupoModal";
import { SeletorCor } from "./SeletorCor";

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
  /** Dono liga ou desliga a lista inteira. Desligar pede confirmação antes. */
  onListaDiaria: (ligada: boolean) => Promise<boolean>;
};

const OPCAO = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/10";

export function GrupoMenu({
  grupo,
  dono,
  compartilhada,
  onRenomear,
  onCor,
  onArquivar,
  onCompartilhar,
  onSair,
  onListaDiaria,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [renomeando, setRenomeando] = useState(false);
  const [confirmando, setConfirmando] = useState<"arquivar" | "sair" | "diaria" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [trocandoLista, setTrocandoLista] = useState(false);
  const fechar = () => setAberto(false);
  useClickOutside(ref, aberto, fechar);
  useEscapeKey(aberto, fechar);

  async function confirmar() {
    setOcupado(true);
    const ok = await (confirmando === "sair" ? onSair() : confirmando === "diaria" ? onListaDiaria(false) : onArquivar());
    setOcupado(false);
    if (ok) setConfirmando(null);
  }

  function aoMudarListaDiaria(ligada: boolean) {
    if (!ligada) {
      fechar();
      setConfirmando("diaria");
      return;
    }
    setTrocandoLista(true);
    void onListaDiaria(true).finally(() => setTrocandoLista(false));
  }

  const aviso =
    confirmando === "sair"
      ? {
          title: `Sair da lista "${grupo.nome}"?`,
          description: "A lista some da sua tela. Para voltar, o dono precisa compartilhar de novo.",
          confirmLabel: "Sair da lista",
          danger: true,
        }
      : confirmando === "diaria"
        ? {
            title: "Desligar lista diária?",
            description: "As tarefas desta lista deixam de repetir.",
            confirmLabel: "Desligar",
            danger: false,
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Opções da lista"
        aria-expanded={aberto}
        className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 space-y-1 rounded-lg border border-white/15 bg-[#0f172a] p-2 shadow-xl">
          {dono ? (
            <>
              <button type="button" className={`${OPCAO} text-white/85`} onClick={abrirDepois(() => setRenomeando(true))}>
                <Pencil className="h-4 w-4" /> Renomear lista
              </button>
              <div className="px-2 py-1.5">
                <span className="mb-2 block text-xs text-white/55">Cor</span>
                <SeletorCor valor={grupo.cor} onChange={onCor} />
              </div>
              <button type="button" className={`${OPCAO} text-white/85`} onClick={abrirDepois(onCompartilhar)}>
                <Share2 className="h-4 w-4" /> Compartilhar lista
              </button>
              <div className={`${OPCAO} text-white/85`}>
                <Repeat className="h-4 w-4" />
                <span className="flex-1 text-left">Lista diária</span>
                <Toggle
                  label="Lista diária"
                  checked={grupo.diaria}
                  disabled={trocandoLista}
                  onChange={aoMudarListaDiaria}
                />
              </div>
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
