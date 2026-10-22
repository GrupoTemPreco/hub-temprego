import { NotificacaoAviso } from "@/components/notificacoes/NotificacaoAviso";
import { NotificacaoFaixa } from "@/components/notificacoes/NotificacaoFaixa";
import { NotificacaoJanela } from "@/components/notificacoes/NotificacaoJanela";
import type { NotificacaoForm } from "./notificacaoForm";

const nada = () => {};

export function NotificacaoPreview({ form }: { form: NotificacaoForm }) {
  const conteudo = {
    titulo: form.titulo || "Título da notificação",
    mensagem: form.mensagem || "A mensagem aparece aqui.",
    nivel: form.nivel,
  };

  return (
    <div>
      <span className="mb-1 block text-sm text-white/70">Pré-visualização</span>
      <div className="relative flex h-80 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#020617]">
        {form.formato === "faixa" && <NotificacaoFaixa notificacao={conteudo} onFechar={nada} embutido />}
        <div className="flex flex-1 gap-2 p-3 opacity-30">
          <div className="w-10 rounded bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-white/15" />
            <div className="h-20 rounded bg-white/10" />
            <div className="h-20 rounded bg-white/10" />
          </div>
        </div>
        {form.formato === "aviso" && (
          <div className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)]">
            <NotificacaoAviso notificacao={conteudo} onFechar={nada} embutido />
          </div>
        )}
        {form.formato === "janela" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
            <NotificacaoJanela notificacao={conteudo} onConfirmar={nada} embutido />
          </div>
        )}
      </div>
    </div>
  );
}
