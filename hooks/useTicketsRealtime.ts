"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ESPERA_MS = 300;

type TabelaTickets = "tickets" | "ticket_eventos" | "ticket_anexos";

/** Registro alterado, como chegou pelo Realtime. */
export type MudancaTicket = {
  tabela: TabelaTickets;
  tipo: "INSERT" | "UPDATE" | "DELETE";
  novo: Record<string, unknown>;
};

/**
 * Assina as mudanças de shell.tickets, shell.ticket_eventos e shell.ticket_anexos.
 * `versao` muda a cada alteração recebida; use como dependência para recarregar dados.
 * `aoMudar` recebe cada registro alterado (ex.: para avisos em tempo real).
 * Usado uma única vez, no TicketsUsuarioProvider do layout; os demais leem `versao` de useTicketsUsuario().
 */
export function useTicketsRealtime(aoMudar?: (mudanca: MudancaTicket) => void) {
  const [versao, setVersao] = useState(0);
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);
  const aoMudarRef = useRef(aoMudar);

  useEffect(() => {
    aoMudarRef.current = aoMudar;
  }, [aoMudar]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const agendar = () => {
      clearTimeout(timer);
      timer = setTimeout(atualizar, ESPERA_MS);
    };
    const ouvir = (tabela: TabelaTickets) => (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      agendar();
      aoMudarRef.current?.({ tabela, tipo: payload.eventType, novo: (payload.new ?? {}) as Record<string, unknown> });
    };

    const canal = supabase
      .channel(`admin-tickets-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "shell", table: "tickets" }, ouvir("tickets"))
      .on("postgres_changes", { event: "*", schema: "shell", table: "ticket_eventos" }, ouvir("ticket_eventos"))
      .on("postgres_changes", { event: "*", schema: "shell", table: "ticket_anexos" }, ouvir("ticket_anexos"))
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [atualizar]);

  return { versao, atualizar };
}
