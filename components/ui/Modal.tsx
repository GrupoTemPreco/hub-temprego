"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Limita a altura do conteúdo à tela e ativa a rolagem interna. */
  rolavel?: boolean;
};

const LARGURAS = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-6xl" };

export function Modal({ open, onClose, title, children, footer, size = "md", rolavel = false }: ModalProps) {
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${LARGURAS[size]} rounded-xl border border-white/10 bg-[#0b1224] shadow-2xl`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={`px-5 py-4 ${rolavel ? "max-h-[calc(100vh-11rem)] overflow-y-auto" : ""}`}>{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
