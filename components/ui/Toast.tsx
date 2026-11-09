"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastTipo = "success" | "error";
type ToastAcao = { rotulo: string; onClick: () => void };
type ToastItem = { id: number; tipo: ToastTipo; mensagem: string; acao?: ToastAcao };

/** Com `acao`, o toast fica aberto até o usuário clicar nela ou fechar. */
export type ToastApi = {
  success: (mensagem: string, acao?: ToastAcao) => void;
  error: (mensagem: string, acao?: ToastAcao) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const DURACAO_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remover = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: ToastTipo, mensagem: string, acao?: ToastAcao) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, tipo, mensagem, acao }]);
      if (!acao) setTimeout(() => remover(id), DURACAO_MS);
    },
    [remover],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (mensagem, acao) => mostrar("success", mensagem, acao),
      error: (mensagem, acao) => mostrar("error", mensagem, acao),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-60 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg backdrop-blur ${
              t.tipo === "success"
                ? "border-emerald-400/30 bg-semaforo-sucesso-fundo text-semaforo-sucesso-texto"
                : "border-rose-400/30 bg-semaforo-critico-fundo text-semaforo-critico-texto"
            }`}
          >
            {t.tipo === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">
              {t.mensagem}
              {t.acao && (
                <button
                  onClick={() => {
                    remover(t.id);
                    t.acao?.onClick();
                  }}
                  className="mt-1.5 block font-medium underline underline-offset-2 hover:opacity-80"
                >
                  {t.acao.rotulo}
                </button>
              )}
            </span>
            <button onClick={() => remover(t.id)} aria-label="Fechar" className="text-texto/50 hover:text-texto">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}
