"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Ticket aberto em ?ticket=<numero>, preservando os demais parâmetros. Exige <Suspense> acima (useSearchParams). */
export function useTicketNaUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const valor = Number(params.get("ticket"));
  const numero = Number.isInteger(valor) && valor > 0 ? valor : null;

  const definir = useCallback(
    (novo: number | null) => {
      const novos = new URLSearchParams(params.toString());
      if (novo) novos.set("ticket", String(novo));
      else novos.delete("ticket");
      const busca = novos.toString();
      router.replace(busca ? `${pathname}?${busca}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { numero, abrir: definir, fechar: useCallback(() => definir(null), [definir]) };
}
