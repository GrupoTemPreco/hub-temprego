type Props = { lidos: number; total: number; confirmacao: boolean; onClick: () => void };

export function BarraLeitura({ lidos, total, confirmacao, onClick }: Props) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((lidos / total) * 100));
  return (
    <button
      onClick={onClick}
      title={confirmacao ? "Confirmaram / público" : "Viram / público"}
      className="group w-32 text-left"
    >
      <span className="mb-1 flex justify-between text-xs text-white/60 group-hover:text-white">
        <span>
          {lidos}/{total}
        </span>
        <span>{confirmacao ? "confirmaram" : "viram"}</span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </span>
    </button>
  );
}
