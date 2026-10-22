"use client";

import { useRef, useState, type DragEvent } from "react";
import { Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ACCEPT_ANEXOS, MAX_ANEXOS_POR_ENVIO } from "@/lib/anexosArquivo";
import type { ControleAnexos } from "@/hooks/useAnexos";
import { AnexoSelecionadoItem } from "./anexos/AnexoSelecionadoItem";

type Props = {
  /** Estado criado com useAnexos() no componente pai, que também liga `anexos.colar` no onPaste do contêiner. */
  anexos: ControleAnexos;
  desabilitado?: boolean;
  /** "area": zona de soltar arquivos (formulário). "compacta": só o botão (caixa de resposta). */
  variante?: "area" | "compacta";
};

export function AnexosInput({ anexos, desabilitado = false, variante = "area" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const cheio = anexos.itens.length >= MAX_ANEXOS_POR_ENVIO;

  function abrirSeletor() {
    if (!desabilitado && !cheio) inputRef.current?.click();
  }

  function soltar(e: DragEvent) {
    e.preventDefault();
    setArrastando(false);
    if (!desabilitado) anexos.adicionar(Array.from(e.dataTransfer.files));
  }

  const eventosArrastar = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      if (!desabilitado) setArrastando(true);
    },
    onDragLeave: () => setArrastando(false),
    onDrop: soltar,
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ANEXOS}
        className="hidden"
        onChange={(e) => {
          anexos.adicionar(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {variante === "area" ? (
        <div
          {...eventosArrastar}
          className={`flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-4 text-center transition-colors ${
            arrastando ? "border-blue-400 bg-blue-500/10" : "border-white/15 bg-white/2"
          }`}
        >
          <Upload className="h-5 w-5 text-white/40" />
          <p className="text-xs text-white/55">Arraste arquivos aqui ou cole um print com Ctrl+V</p>
          <Button size="sm" variant="secondary" onClick={abrirSeletor} disabled={desabilitado || cheio}>
            <Paperclip className="h-3.5 w-3.5" /> Anexar
          </Button>
          <p className="text-[11px] text-white/35">
            Até {MAX_ANEXOS_POR_ENVIO} arquivos de 10 MB: imagens, PDF, Excel, Word, CSV ou TXT
          </p>
        </div>
      ) : (
        <div {...eventosArrastar} className={`flex items-center gap-2 rounded-md ${arrastando ? "bg-blue-500/10" : ""}`}>
          <Button size="sm" variant="ghost" onClick={abrirSeletor} disabled={desabilitado || cheio}>
            <Paperclip className="h-3.5 w-3.5" /> Anexar
          </Button>
          <span className="text-xs text-white/35">ou cole um print com Ctrl+V</span>
        </div>
      )}

      {anexos.avisos.map((aviso) => (
        <p key={aviso} className="text-xs text-rose-400">
          {aviso}
        </p>
      ))}

      {anexos.itens.length > 0 && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {anexos.itens.map((item) => (
            <AnexoSelecionadoItem
              key={item.id}
              item={item}
              desabilitado={desabilitado}
              onRemover={() => anexos.remover(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
