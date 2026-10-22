"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AnexosInput } from "@/components/tickets/AnexosInput";
import { useAnexos } from "@/hooks/useAnexos";
import type { AoProgredir, ArquivoParaEnvio } from "@/lib/ticketsAnexos";

type Modo = "resposta" | "nota";

type Props = {
  /** Falso no modo usuário: sem a aba "Nota interna". */
  permitirNotaInterna?: boolean;
  onEnviar: (
    mensagem: string,
    interno: boolean,
    arquivos: ArquivoParaEnvio[],
    aoProgredir: AoProgredir,
  ) => Promise<boolean>;
};

export function TicketResposta({ permitirNotaInterna = true, onEnviar }: Props) {
  const [modo, setModo] = useState<Modo>("resposta");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const anexos = useAnexos();
  const interno = permitirNotaInterna && modo === "nota";
  const podeEnviar = !enviando && !anexos.preparando && (Boolean(texto.trim()) || anexos.prontos.length > 0);

  async function enviar() {
    if (!podeEnviar) return;
    setEnviando(true);
    const ok = await onEnviar(texto, interno, anexos.prontos, anexos.definirProgresso);
    setEnviando(false);
    if (ok) {
      setTexto("");
      anexos.limpar();
    } else {
      anexos.zerarProgresso();
    }
  }

  return (
    <div className={`px-5 pb-4 ${permitirNotaInterna ? "" : "pt-3"}`} onPaste={anexos.colar}>
      {permitirNotaInterna && (
        <Tabs
          variant="underline"
          value={modo}
          onChange={setModo}
          items={[
            { id: "resposta", label: "Resposta" },
            { id: "nota", label: "Nota interna" },
          ]}
        />
      )}
      <textarea
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
        }}
        placeholder={interno ? "Nota visível só para admins..." : "Escreva uma resposta..."}
        className={`mt-2 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none ${
          interno ? "border-amber-400/40 focus:border-amber-400" : "border-white/10 focus:border-blue-500"
        }`}
      />
      <div className="mt-1">
        <AnexosInput anexos={anexos} desabilitado={enviando} variante="compacta" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-white/35">Ctrl + Enter para enviar</span>
        <Button onClick={enviar} disabled={!podeEnviar} variant={interno ? "warning" : "primary"}>
          <Send className="h-4 w-4" /> {enviando ? "Enviando..." : interno ? "Adicionar nota" : "Enviar resposta"}
        </Button>
      </div>
    </div>
  );
}
