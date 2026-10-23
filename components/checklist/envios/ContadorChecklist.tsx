type Props = { total: number; className?: string };

/** Tarefas recebidas aguardando resposta; some quando não há nenhuma. */
export function ContadorChecklist({ total, className = "" }: Props) {
  if (total <= 0) return null;
  return (
    <span
      aria-label={`${total} ${total === 1 ? "tarefa recebida" : "tarefas recebidas"}`}
      className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ${className}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
