"use client";

import { useSyncExternalStore } from "react";

const LARGURA_MOBILE = 768;

function inscrever(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function useIsMobile() {
  return useSyncExternalStore(
    inscrever,
    () => window.innerWidth < LARGURA_MOBILE,
    () => false,
  );
}
