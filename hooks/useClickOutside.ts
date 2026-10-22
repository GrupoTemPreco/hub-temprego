"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  ativo: boolean,
  onFora: () => void,
) {
  const callbackRef = useRef(onFora);

  useEffect(() => {
    callbackRef.current = onFora;
  }, [onFora]);

  useEffect(() => {
    if (!ativo) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) callbackRef.current();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ativo, ref]);
}
