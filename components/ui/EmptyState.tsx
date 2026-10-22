import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  compact?: boolean;
};

export function EmptyState({ title, description, icon: Icon = Inbox, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "py-14"}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/40">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-white/80">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-white/50">{description}</p>}
    </div>
  );
}
