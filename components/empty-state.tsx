import type { ReactNode } from "react";

/** Server-safe empty state (same look as the client EmptyState in ui.tsx). */
export function EmptyStateStatic({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <span className="text-muted">{icon}</span>
      <span className="text-body font-medium">{title}</span>
      {body && <span className="max-w-sm text-small text-muted">{body}</span>}
      {action}
    </div>
  );
}
