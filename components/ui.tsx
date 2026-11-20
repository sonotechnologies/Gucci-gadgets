"use client";
import { Check, Timer } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { batteryTone, gradeTone } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatCountdown, formatNaira, formatSaving } from "@/lib/format";
import type { Grade } from "@/lib/types";

const toneBg = { success: "bg-success", warning: "bg-warning", deal: "bg-deal", accent: "bg-accent" } as const;

/** Condition chip: "New" on accent-soft, or "UK-used · A" on surface-2 with a status dot. */
export function ConditionChip({ label, isNew, grade, size = "sm" }: { label: string; isNew: boolean; grade?: Grade | null; size?: "sm" | "md" }) {
  const dot = isNew ? "accent" : gradeTone(grade);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 text-micro font-medium text-text",
        size === "md" ? "h-[26px]" : "h-6",
        isNew ? "bg-accent-soft" : "bg-surface-2",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", toneBg[dot])} />
      {label}
    </span>
  );
}

export function GradeBadge({ grade, className }: { grade: Grade; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold text-ink", toneBg[gradeTone(grade)], className)}>
      Grade {grade}
    </span>
  );
}

export function BatteryBar({ pct, compact = false }: { pct: number; compact?: boolean }) {
  const tone = toneBg[batteryTone(pct)];
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5" title={`Battery health ${pct}%`}>
        <span className="block h-1.5 w-6 overflow-hidden rounded-full bg-surface-2">
          <span className={cn("block h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
        </span>
        <span className="num text-micro text-muted">{pct}%</span>
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-small">
        <span>Battery health</span>
        <span className="num">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Battery health">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DealBadge({ saving, className }: { saving: number; className?: string }) {
  return (
    <span className={cn("num inline-flex h-6 items-center rounded-md bg-deal px-2 text-micro font-medium text-ink", className)}>
      {formatSaving(saving)}
    </span>
  );
}

export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function Countdown({ endsAt, prefix = "Ends in", className }: { endsAt: string; prefix?: string; className?: string }) {
  const now = useNow();
  const ms = now == null ? null : new Date(endsAt).getTime() - now;
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full bg-deal px-2.5 text-[13px] font-medium text-ink", className)}>
      <Timer size={14} strokeWidth={1.75} aria-hidden />
      <span className="num" suppressHydrationWarning>
        {ms == null ? `${prefix} --:--:--` : ms <= 0 ? "Deal ended" : `${prefix} ${formatCountdown(ms)}`}
      </span>
    </span>
  );
}

export function PriceBlock({ price, old, size = "md" }: { price: number; old?: number | null; size?: "sm" | "md" | "lg" }) {
  const drop = old != null && old > price;
  return (
    <div className="num flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={cn("font-medium", size === "lg" ? "text-[28px] leading-9" : size === "md" ? "text-body" : "text-small")}>{formatNaira(price)}</span>
      {drop && <span className={cn("text-muted line-through", size === "lg" ? "text-body" : "text-[13px]")}>{formatNaira(old!)}</span>}
      {drop && size === "lg" && <DealBadge saving={old! - price} className="self-center" />}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  mono = false,
  label,
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  mono?: boolean;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-btn bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 flex-1 rounded-lg px-2 text-small font-medium transition-colors duration-150 ease-out disabled:opacity-40",
              mono && "font-mono",
              active ? "bg-bg text-text shadow-[0_1px_2px_rgba(0,0,0,.12)]" : "text-muted hover:text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-11 shrink-0 items-center disabled:opacity-50"
    >
      <span className={cn("relative h-6 w-10 rounded-full transition-colors duration-150", checked ? "bg-accent" : "bg-surface-2 ring-1 ring-inset ring-border")}>
        <span
          className={cn(
            "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left] duration-150 ease-out",
            checked ? "left-[19px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

/** Large tappable option card (swap + repairs). */
export function OptionCard({
  selected,
  onClick,
  icon,
  children,
  layout = "row",
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  layout?: "row" | "column";
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex rounded-card border-2 p-4 text-left text-[15px] font-medium text-text transition-colors duration-150 ease-out",
        layout === "row" ? "min-h-16 items-center gap-2.5" : "min-h-24 flex-col items-start justify-between gap-3",
        selected ? "border-accent bg-accent-soft" : "border-border bg-bg hover:bg-surface",
        className,
      )}
    >
      {icon && <span className={cn("flex shrink-0", selected ? "text-accent" : "text-muted")}>{icon}</span>}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <span className="text-muted">{icon}</span>
      <span className="text-body font-medium">{title}</span>
      {body && <span className="max-w-sm text-small text-muted">{body}</span>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="aspect-square animate-pulse rounded-card bg-surface" />
      <Skeleton className="h-3.5 w-[70%]" />
      <Skeleton className="h-3 w-[45%]" />
      <Skeleton className="h-3.5 w-[35%]" />
    </div>
  );
}

export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 text-small leading-[1.45]">
      <Check size={16} className="mt-0.5 shrink-0 text-success" strokeWidth={1.75} aria-hidden />
      <span>{children}</span>
    </div>
  );
}
