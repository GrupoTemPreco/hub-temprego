"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useChecklistEnvios } from "../envios/ChecklistEnviosProvider";

const MAXIMO = 3;

/** Até 3 avatares sobrepostos e "+N" para o resto. */
export function AvataresMembros({ usuarioIds }: { usuarioIds: string[] }) {
  const { nomeDe } = useChecklistEnvios();
  if (usuarioIds.length === 0) return null;
  const visiveis = usuarioIds.slice(0, MAXIMO);
  const resto = usuarioIds.length - visiveis.length;
  const nomes = usuarioIds.map(nomeDe).join(", ");

  return (
    <span className="flex shrink-0 items-center -space-x-1.5" title={nomes} aria-label={`Membros: ${nomes}`}>
      {visiveis.map((id) => (
        <span key={id} className="rounded-full ring-2 ring-[#0b1224]">
          <Avatar nome={nomeDe(id)} size="xs" />
        </span>
      ))}
      {resto > 0 && (
        <span className="z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1 text-[9px] font-semibold text-white/80 ring-2 ring-[#0b1224]">
          +{resto}
        </span>
      )}
    </span>
  );
}
