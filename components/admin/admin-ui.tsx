"use client";
import { CircleAlert, CircleCheck } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/admin/actions";

interface AdminToastState {
  msg: { text: string; tone: "ok" | "error" } | null;
  id: number;
  show: (text: string, tone?: "ok" | "error") => void;
}

export const useAdminToast = create<AdminToastState>()((set, get) => ({
  msg: null,
  id: 0,
  show: (text, tone = "ok") => {
    const id = get().id + 1;
    set({ msg: { text, tone }, id });
    setTimeout(() => get().id === id && set({ msg: null }), tone === "error" ? 5000 : 2200);
  },
}));

/** Show the result of a server action as a toast. Returns true on success. */
export function useReport() {
  const show = useAdminToast((s) => s.show);
  return (r: ActionResult, okText: string) => {
    if (r.ok) show(okText);
    else show(r.error, "error");
    return r.ok;
  };
}

export function AdminToast() {
  const msg = useAdminToast((s) => s.msg);
  const id = useAdminToast((s) => s.id);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6">
      {msg && (
        <div
          key={id}
          className={cn(
            "flex max-w-md animate-rise items-start gap-2 rounded-btn px-[18px] py-3 text-small font-medium shadow-[0_8px_24px_rgba(0,0,0,.18)]",
            msg.tone === "ok" ? "bg-text text-bg" : "bg-deal text-ink",
          )}
        >
          {msg.tone === "ok" ? <CircleCheck size={18} strokeWidth={1.75} className="shrink-0" /> : <CircleAlert size={18} strokeWidth={1.75} className="shrink-0" />}
          {msg.text}
        </div>
      )}
    </div>
  );
}

export function AdminCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-card border border-border bg-bg", className)}>{children}</div>;
}

export function PageTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-[24px] font-semibold tracking-[-0.01em] md:text-[28px]">{children}</h1>
      {action}
    </div>
  );
}
