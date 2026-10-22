"use client";

import type { ComponentType } from "react";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { SaudacaoUsuario } from "./SaudacaoUsuario";
import { MuralAvisos } from "./MuralAvisos";
import { SecaoMeusTickets } from "./SecaoMeusTickets";
import { AtalhosFerramentas } from "./AtalhosFerramentas";

/** Blocos do Início, empilhados nesta ordem. Para uma nova seção, crie o componente e inclua aqui. */
const SECOES: Array<{ id: string; Secao: ComponentType }> = [
  { id: "mural-avisos", Secao: MuralAvisos },
  { id: "meus-tickets", Secao: SecaoMeusTickets },
  { id: "ferramentas", Secao: AtalhosFerramentas },
];

export function InicioUsuario() {
  const usuario = useUsuarioAtual();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-10">
        <SaudacaoUsuario nome={usuario.nome} />
        {SECOES.map(({ id, Secao }) => (
          <Secao key={id} />
        ))}
      </div>
    </div>
  );
}
