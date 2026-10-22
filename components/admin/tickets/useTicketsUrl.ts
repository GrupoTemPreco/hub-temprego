"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET, STATUS_TICKET } from "@/lib/tickets";
import type { AtalhoTicket, FiltrosTickets } from "@/lib/admin/ticketsConsulta";

const ATALHOS: AtalhoTicket[] = ["atrasados", "parados", "comigo", "meus", "abertos-por-mim", "sem-responsavel"];

function valido<T extends string>(valor: string | null, opcoes: readonly T[]): T | "" {
  return valor && (opcoes as readonly string[]).includes(valor) ? (valor as T) : "";
}

export type VisaoTickets = "lista" | "kanban";

export type EstadoTicketsUrl = {
  filtros: FiltrosTickets;
  visao: VisaoTickets;
  lixeira: boolean;
  ticketAberto: number | null;
};

/** Valor null ou "" remove o parâmetro da URL. */
export type AlteracaoUrl = Partial<Record<keyof FiltrosTickets | "visao" | "lixeira" | "ticket", string | boolean | null>>;

export function useTicketsUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const estado = useMemo<EstadoTicketsUrl>(() => {
    const numero = Number(params.get("ticket"));
    return {
      filtros: {
        q: params.get("q") ?? "",
        status: valido(params.get("status"), STATUS_TICKET.map((s) => s.value)),
        categoria: valido(params.get("categoria"), CATEGORIAS_TICKET.map((c) => c.value)),
        prioridade: valido(params.get("prioridade"), PRIORIDADES_TICKET.map((p) => p.value)),
        setor: params.get("setor") ?? "",
        pessoa: params.get("pessoa") ?? "",
        responsavel: params.get("responsavel") ?? "",
        de: params.get("de") ?? "",
        ate: params.get("ate") ?? "",
        filtro: valido(params.get("filtro"), ATALHOS),
        encerrados: params.get("encerrados") === "1",
      },
      visao: params.get("visao") === "kanban" ? "kanban" : "lista",
      lixeira: params.get("lixeira") === "1",
      ticketAberto: Number.isInteger(numero) && numero > 0 ? numero : null,
    };
  }, [params]);

  const alterar = useCallback(
    (mudancas: AlteracaoUrl) => {
      const novos = new URLSearchParams(params.toString());
      novos.set("aba", "tickets");
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === null || valor === "" || valor === false) novos.delete(chave);
        else novos.set(chave, valor === true ? "1" : String(valor));
      }
      router.replace(`${pathname}?${novos.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const limparFiltros = useCallback(() => {
    const novos = new URLSearchParams({ aba: "tickets" });
    for (const chave of ["visao", "lixeira", "ticket"]) {
      const v = params.get(chave);
      if (v) novos.set(chave, v);
    }
    router.replace(`${pathname}?${novos.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  return { ...estado, alterar, limparFiltros };
}
