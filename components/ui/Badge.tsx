import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "orange" | "danger" | "purple";

/** Chips coloridos: no escuro iguais aos de hoje; no claro, pastel + texto 700. */
export const CHIP = {
  info: "border-chip-info-borda bg-chip-info-fundo text-chip-info-texto",
  success: "border-chip-sucesso-borda bg-chip-sucesso-fundo text-chip-sucesso-texto",
  warning: "border-chip-atencao-borda bg-chip-atencao-fundo text-chip-atencao-texto",
  orange: "border-chip-laranja-borda bg-chip-laranja-fundo text-chip-laranja-texto",
  danger: "border-chip-critico-borda bg-chip-critico-fundo text-chip-critico-texto",
  purple: "border-chip-roxo-borda bg-chip-roxo-fundo text-chip-roxo-texto",
} as const;

const CORES: Record<BadgeVariant, string> = {
  neutral: "border-borda bg-superficie-hover text-texto/75",
  info: CHIP.info,
  success: CHIP.success,
  warning: CHIP.warning,
  orange: CHIP.orange,
  danger: CHIP.danger,
  purple: CHIP.purple,
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${CORES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
