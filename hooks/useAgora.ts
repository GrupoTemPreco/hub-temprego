"use client";

import { useEffect, useState } from "react";

/** Horário atual (ms) atualizado a cada `intervaloMs`, para textos como "há 5 minutos". */
export function useAgora(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);

  return agora;
}
