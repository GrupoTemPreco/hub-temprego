"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { aplicarTema, lerTemaLocal, salvarTemaNoBanco, type Tema } from "@/lib/tema";
import { useUsuarioAtual } from "./UsuarioAtualProvider";

/** Ícone no canto superior direito: sol para ir ao claro, lua para voltar ao escuro. */
export function SeletorTema() {
  const { id } = useUsuarioAtual();
  const [tema, setTema] = useState<Tema>(lerTemaLocal);

  function alternar() {
    const proximo: Tema = tema === "escuro" ? "claro" : "escuro";
    setTema(proximo);
    aplicarTema(proximo);
    void salvarTemaNoBanco(id, proximo);
  }

  const paraClaro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      title={paraClaro ? "Modo claro" : "Modo escuro"}
      aria-label={paraClaro ? "Modo claro" : "Modo escuro"}
      className="fixed right-3 top-3 z-40 rounded-lg p-2 text-texto-suave transition-colors hover:bg-superficie-hover hover:text-texto"
    >
      {paraClaro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
