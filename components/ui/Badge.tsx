import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "orange" | "danger" | "purple";

const CORES: Record<BadgeVariant, string> = {
  neutral: "border-white/15 bg-white/10 text-white/75",
  info: "border-blue-400/30 bg-blue-500/15 text-blue-300",
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  orange: "border-orange-400/30 bg-orange-500/15 text-orange-300",
  danger: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  purple: "border-violet-400/30 bg-violet-500/15 text-violet-300",
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
