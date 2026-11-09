import type { ComponentType } from "react";

export type StatCor = "blue" | "cyan" | "red" | "green";

const CORES: Record<StatCor, { icone: string; destaque: string }> = {
  blue: { icone: "bg-blue-500/15 text-blue-400", destaque: "border-borda" },
  cyan: { icone: "bg-cyan-500/15 text-cyan-400", destaque: "border-borda" },
  red: { icone: "bg-rose-500/15 text-rose-400", destaque: "border-rose-500/30" },
  green: { icone: "bg-emerald-500/15 text-emerald-400", destaque: "border-borda" },
};

type StatCardProps = {
  titulo: string;
  valor: number | string | null;
  legenda: string;
  icon: ComponentType<{ className?: string }>;
  cor: StatCor;
  onClick?: () => void;
};

export function StatCard({ titulo, valor, legenda, icon: Icon, cor, onClick }: StatCardProps) {
  const estilo = CORES[cor];
  const destacar = cor === "red" && typeof valor === "number" && valor > 0;
  const Raiz = onClick ? "button" : "div";

  return (
    <Raiz
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border bg-superficie p-4 text-left ${
        destacar ? estilo.destaque : "border-borda"
      } ${onClick ? "transition-colors hover:bg-superficie" : ""}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${estilo.icone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-texto/70">{titulo}</p>
        <p className="text-2xl font-semibold leading-tight">{valor ?? "—"}</p>
        <p className={`truncate text-xs ${destacar ? "text-rose-400" : "text-texto-suave"}`}>{legenda}</p>
      </div>
    </Raiz>
  );
}
