"use client";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, type ReactNode } from "react";
import { SEED_SETTINGS } from "@/lib/seed";
import type { Settings } from "@/lib/types";

const SettingsContext = createContext<Settings>(SEED_SETTINGS);

export function useSettings(): Settings {
  return useContext(SettingsContext);
}

export function Providers({ children, settings }: { children: ReactNode; settings: Settings }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="gg-theme">
      <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
    </ThemeProvider>
  );
}
