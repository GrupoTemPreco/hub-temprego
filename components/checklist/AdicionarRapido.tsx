"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type Props = { onAdicionar: (titulo: string) => Promise<boolean> };

/** Enter cria o item só com o título; nível e urgência ficam no padrão. */
export function AdicionarRapido({ onAdicionar }: Props) {
  const [titulo, setTitulo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    const texto = titulo.trim();
    if (!texto || salvando) return;
    setSalvando(true);
    setTitulo("");
    const ok = await onAdicionar(texto);
    if (!ok) setTitulo(texto);
    setSalvando(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      className="flex items-center gap-2 border-t border-white/5 px-3 py-2"
    >
      <Plus className="h-4 w-4 shrink-0 text-white/35" />
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Adicionar item..."
        aria-label="Adicionar item"
        className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm outline-none focus:border-blue-500"
      />
    </form>
  );
}
