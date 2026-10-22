"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  recebidosComNovidade: number;
  setorSemResponsavel: number;
  onVerRecebidos: () => void;
};

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;

/** Card do sistema no mural (não vem de shell.notificacoes): tickets que pedem a atenção da pessoa. */
export function CardAvisoTickets({ recebidosComNovidade, setorSemResponsavel, onVerRecebidos }: Props) {
  // Azul quando há novidade para ler; âmbar quando só há tickets do setor esperando alguém assumir.
  const destaque =
    recebidosComNovidade > 0
      ? { borda: "border-blue-400/50 bg-blue-500/10", icone: "bg-blue-500/20 text-blue-300" }
      : { borda: "border-amber-400/50 bg-amber-500/10", icone: "bg-amber-500/20 text-amber-300" };

  return (
    <article className={`flex w-full flex-col gap-3 rounded-xl border-2 p-4 ${destaque.borda}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${destaque.icone}`}>
          <Inbox className="h-5 w-5" />
        </span>
        <h3 className="font-semibold text-white">Seus tickets</h3>
      </div>
      <ul className="space-y-1 text-sm text-white/85">
        {recebidosComNovidade > 0 && (
          <li>Você tem {plural(recebidosComNovidade, "ticket recebido", "tickets recebidos")} com novidades</li>
        )}
        {setorSemResponsavel > 0 && (
          <li>
            {plural(setorSemResponsavel, "ticket do seu setor", "tickets do seu setor")} aguardando alguém assumir
          </li>
        )}
      </ul>
      <Button size="sm" className="mt-auto self-start" onClick={onVerRecebidos}>
        Ver recebidos
      </Button>
    </article>
  );
}
