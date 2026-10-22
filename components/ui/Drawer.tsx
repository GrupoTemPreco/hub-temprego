"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Área fixa abaixo do conteúdo rolável. */
  footer?: ReactNode;
  width?: string;
};

export function Drawer({ open, onClose, title, children, footer, width = "max-w-xl" }: DrawerProps) {
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        className={`flex h-full w-full ${width} flex-col border-l border-white/10 bg-[#0b1224] shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="min-w-0 text-sm font-medium text-white/80">{title}</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-white/10">{footer}</div>}
      </aside>
    </div>
  );
}
