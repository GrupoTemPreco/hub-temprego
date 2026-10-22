export function ContadorNovidades({ total, className = "" }: { total: number; className?: string }) {
  if (total <= 0) return null;
  const rotulo = `${total} ${total === 1 ? "ticket com novidade" : "tickets com novidade"}`;
  return (
    <span
      title={rotulo}
      aria-label={rotulo}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_0_10px_rgba(34,211,238,0.6)] ${className}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
