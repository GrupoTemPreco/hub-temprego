"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Um parâmetro da URL, preservando os demais. Exige <Suspense> acima (useSearchParams). */
export function useParametroUrl(nome: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const valor = params.get(nome);

  const definir = useCallback(
    (novo: string | null) => {
      const novos = new URLSearchParams(params.toString());
      if (novo) novos.set(nome, novo);
      else novos.delete(nome);
      const busca = novos.toString();
      router.replace(busca ? `${pathname}?${busca}` : pathname, { scroll: false });
    },
    [nome, params, pathname, router],
  );

  return { valor, definir, limpar: useCallback(() => definir(null), [definir]) };
}

/** Item aberto em ?item=<id>. */
export function useItemNaUrl() {
  const { valor, definir, limpar } = useParametroUrl("item");
  return { itemId: valor, abrir: definir, fechar: limpar };
}
