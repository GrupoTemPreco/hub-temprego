"use client";

import { useEffect, useRef } from "react";

// Pilha de camadas abertas: o ESC fecha só a mais recente (ex.: confirmação sobre um drawer).
const pilha: symbol[] = [];

export function useEscapeKey(ativo: boolean, onEscape: () => void) {
  const callbackRef = useRef(onEscape);

  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!ativo) return;
    const id = Symbol("camada");
    pilha.push(id);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || pilha[pilha.length - 1] !== id) return;
      event.stopPropagation();
      callbackRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const index = pilha.indexOf(id);
      if (index >= 0) pilha.splice(index, 1);
    };
  }, [ativo]);
}
