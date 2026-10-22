"use client";

import { FORMATOS_NOTIFICACAO, NIVEIS_NOTIFICACAO } from "@/lib/notificacoes";
import type { ErrosForm, NotificacaoForm } from "./notificacaoForm";

export const CAMPO = "w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500";
export const borda = (erro?: string) => (erro ? "border-rose-500" : "border-white/10");

export function Erro({ texto }: { texto?: string }) {
  return texto ? <span className="mt-1 block text-xs text-rose-400">{texto}</span> : null;
}

type Props = {
  form: NotificacaoForm;
  set: (parcial: Partial<NotificacaoForm>) => void;
  erros: ErrosForm;
};

export function NotificacaoCamposConteudo({ form, set, erros }: Props) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">
          Título <span className="text-rose-400">*</span>
        </span>
        <input
          autoFocus
          value={form.titulo}
          onChange={(e) => set({ titulo: e.target.value })}
          placeholder="Ex.: Manutenção do sistema"
          className={`${CAMPO} ${borda(erros.titulo)}`}
        />
        <Erro texto={erros.titulo} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">
          Mensagem <span className="text-rose-400">*</span>
        </span>
        <textarea
          rows={4}
          value={form.mensagem}
          onChange={(e) => set({ mensagem: e.target.value })}
          placeholder="Digite a mensagem que será exibida para os usuários..."
          className={`${CAMPO} resize-y ${borda(erros.mensagem)}`}
        />
        <Erro texto={erros.mensagem} />
      </label>

      <div>
        <span className="mb-1 block text-sm text-white/70">Nível</span>
        <div className="flex flex-wrap gap-2">
          {NIVEIS_NOTIFICACAO.map((n) => (
            <button
              key={n.value}
              type="button"
              onClick={() => set({ nivel: n.value })}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                form.nivel === n.value
                  ? "border-blue-500 bg-blue-600/20 text-white"
                  : "border-white/10 text-white/65 hover:bg-white/5"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm text-white/70">Formato</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {FORMATOS_NOTIFICACAO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => set({ formato: f.value })}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                form.formato === f.value ? "border-blue-500 bg-blue-600/15" : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span className="block text-sm font-medium">{f.label}</span>
              <span className="block text-xs text-white/50">{f.descricao}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
