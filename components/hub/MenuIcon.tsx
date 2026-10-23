export type MenuIconKind =
  | "inicio"
  | "analises"
  | "estoque"
  | "financeiro"
  | "compras"
  | "checklist"
  | "tarefas"
  | "rh"
  | "monitoramento"
  | "dp"
  | "marketing"
  | "admin";

export function MenuIcon({ kind, className }: { kind: MenuIconKind; className?: string }) {
  const common = className ?? "h-4 w-4 shrink-0";
  switch (kind) {
    case "inicio":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 11 12 4l9 7" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "analises":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 19h16" />
          <path d="M7 15V9" />
          <path d="M12 15V5" />
          <path d="M17 15v-3" />
        </svg>
      );
    case "estoque":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="3" y="12" width="8" height="8" rx="1" />
          <rect x="13" y="12" width="8" height="8" rx="1" />
          <rect x="8" y="4" width="8" height="8" rx="1" />
        </svg>
      );
    case "financeiro":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h4" />
        </svg>
      );
    case "compras":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M6 6h15l-1.5 9h-11L6 6Z" />
          <path d="M6 6 5 3H3" />
          <circle cx="9" cy="20" r="1.6" />
          <circle cx="17" cy="20" r="1.6" />
        </svg>
      );
    case "checklist":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "tarefas":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="m3 6 1.5 1.5L7 5" />
          <path d="m3 12 1.5 1.5L7 11" />
          <path d="m3 18 1.5 1.5L7 17" />
          <path d="M11 6h10M11 12h10M11 18h10" />
        </svg>
      );
    case "rh":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M4 18c.6-2.2 2.4-3.5 4-3.5s3.4 1.3 4 3.5" />
          <path d="M12 18c.5-1.8 2-3 4-3s3.5 1.2 4 3" />
        </svg>
      );
    case "monitoramento":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="m8 12 2 2 4-4" />
          <path d="M8 17h8" />
        </svg>
      );
    case "dp":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v3h3" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
    case "marketing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 11v2" />
          <path d="M7 9v6" />
          <path d="M11 7v10" />
          <path d="M15 10v4" />
          <path d="M19 6v12" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 3 4 7v6c0 4.5 3 7.8 8 9 5-1.2 8-4.5 8-9V7l-8-4Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      );
  }
}

export function menuIconKindAnalise(appId: string): "estoque" | "financeiro" | "compras" {
  if (appId === "estoque") return "estoque";
  if (appId === "financeiro") return "financeiro";
  return "compras";
}
