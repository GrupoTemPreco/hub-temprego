"use client";

import { useState, type ReactNode } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { assumirTicket } from "@/lib/admin/ticketsAcoes";
import type { Ticket } from "@/lib/types/shell";
import { ListaTicketsUsuario } from "./ListaTicketsUsuario";
import { useTicketsUsuario } from "./TicketsUsuarioProvider";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">{titulo}</h3>
      {children}
    </section>
  );
}

export function RecebidosTickets({ onAbrir }: { onAbrir: (ticket: Ticket) => void }) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const { classificados, novidades, referencias, atualizar } = useTicketsUsuario();
  const [assumindo, setAssumindo] = useState<string | null>(null);
  if (!referencias) return null;
  const deQuem = (t: Ticket) => `De ${referencias.nomes.usuario(t.autor_id)}`;

  async function assumir(t: Ticket) {
    setAssumindo(t.id);
    try {
      await assumirTicket(t.id, usuario.id);
      toast.success(`Você assumiu o ticket #${t.numero}.`);
      atualizar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setAssumindo(null);
    }
  }

  return (
    <div className="space-y-5">
      {classificados.semResponsavelDoSetor.length > 0 && (
        <Secao titulo="Do meu setor, sem responsável">
          <ListaTicketsUsuario
            tickets={classificados.semResponsavelDoSetor}
            outraParte={deQuem}
            novidades={novidades}
            onAbrir={onAbrir}
            acao={(t) => (
              <Button size="sm" variant="secondary" disabled={assumindo !== null} onClick={() => assumir(t)}>
                <UserCheck className="h-3.5 w-3.5" /> {assumindo === t.id ? "Assumindo..." : "Assumir"}
              </Button>
            )}
          />
        </Secao>
      )}

      <Secao titulo="Recebidos">
        <ListaTicketsUsuario
          tickets={classificados.recebidos}
          outraParte={deQuem}
          novidades={novidades}
          onAbrir={onAbrir}
          vazio="Nenhum ticket recebido."
        />
      </Secao>

      {classificados.participei.length > 0 && (
        <Secao titulo="Em que participei">
          <ListaTicketsUsuario
            tickets={classificados.participei}
            outraParte={deQuem}
            novidades={novidades}
            onAbrir={onAbrir}
          />
        </Secao>
      )}
    </div>
  );
}
