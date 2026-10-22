"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ESPERA_MS = 300;

/**
 * Assina as mudanças de shell.tickets, shell.ticket_eventos e shell.ticket_anexos.
 * `versao` muda a cada alteração recebida; use como dependência para recarregar dados.
 * Usado uma única vez, no TicketsUsuarioProvider do layout; os demais leem `versao` de useTicketsUsuario().
 */
export function useTicketsRealtime() {
  const [versao, setVersao] = useState(0);
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const agendar = () => {
      clearTimeout(timer);
      timer = setTimeout(atualizar, ESPERA_MS);
    };

    const canal = supabase
      .channel(`admin-tickets-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "shell", table: "tickets" }, agendar)
      .on("postgres_changes", { event: "*", schema: "shell", table: "ticket_eventos" }, agendar)
      .on("postgres_changes", { event: "*", schema: "shell", table: "ticket_anexos" }, agendar)
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [atualizar]);

  return { versao, atualizar };
}
