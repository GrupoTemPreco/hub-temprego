"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(pointer: coarse)";

function inscrever(callback: () => void) {
  const mql = window.matchMedia(CONSULTA);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** Verdadeiro em telas de toque (celular, tablet), onde arrastar disputa com a rolagem. */
export function usePonteiroToque() {
  return useSyncExternalStore(
    inscrever,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
