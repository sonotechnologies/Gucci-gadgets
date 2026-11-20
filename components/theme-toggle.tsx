"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/stores";
import { cn } from "@/lib/cn";

export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "full" | "sidebar"; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  const toggle = () => setTheme(dark ? "light" : "dark");
  const Icon = dark ? Sun : Moon;
  const label = dark ? "Light mode" : "Dark mode";

  if (variant === "full") {
    return (
      <button type="button" onClick={toggle} className={cn("btn btn-secondary btn-lg w-full", className)}>
        <Icon size={18} strokeWidth={1.5} />
        {label}
      </button>
    );
  }
  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn("flex h-11 items-center gap-3 rounded-btn px-3 text-small text-muted hover:bg-surface-2", className)}
      >
        <Icon size={18} strokeWidth={1.5} />
        {label}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${label.toLowerCase()}`} className={cn("icon-btn", className)}>
      <Icon size={20} strokeWidth={1.5} />
    </button>
  );
}
