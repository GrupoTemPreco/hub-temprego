import { Paperclip } from "lucide-react";

export function ContadorAnexos({ total }: { total?: number }) {
  if (!total) return null;
  const rotulo = `${total} ${total === 1 ? "anexo" : "anexos"}`;
  return (
    <span title={rotulo} aria-label={rotulo} className="inline-flex shrink-0 items-center gap-0.5 text-xs text-white/50">
      <Paperclip className="h-3.5 w-3.5" />
      {total}
    </span>
  );
}
