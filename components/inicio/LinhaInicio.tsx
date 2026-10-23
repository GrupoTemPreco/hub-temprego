"use client";

import { LinhaCards } from "@/components/ui/LinhaCards";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { MeuChecklistCard } from "@/components/checklist/MeuChecklistCard";
import { useChecklistDados } from "@/components/checklist/useChecklistDados";
import { PrecisaAtencao } from "./atencao/PrecisaAtencao";
import { CardMeusTickets } from "./CardMeusTickets";

/** Linha de cards abaixo do Mural; sem acesso ao checklist, os dois restantes dividem a largura. */
export function LinhaInicio() {
  const usuario = useUsuarioAtual();
  // Uma carga só do checklist para os dois cards; sem acesso, nada é consultado.
  const dados = useChecklistDados(usuario.id, { criarGrupoInicial: false, ativo: usuario.acessoChecklist });
  const checklist = usuario.acessoChecklist ? dados : null;

  return (
    <LinhaCards>
      <PrecisaAtencao checklist={checklist} altura="360" />
      {checklist && <MeuChecklistCard checklist={checklist} />}
      <CardMeusTickets />
    </LinhaCards>
  );
}
