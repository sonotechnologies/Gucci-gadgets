"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  key: string; // variant id
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  category: string;
  storage: string | null;
  colour: string | null;
  conditionNote: string | null;
  chip: string;
  unitPrice: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  bump: number; // increments on add → badge bounce
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      bump: 0,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.key === item.key);
          const items = existing
            ? s.items.map((i) => (i.key === item.key ? { ...i, ...item, qty: Math.min(i.qty + qty, 20) } : i))
            : [...s.items, { ...item, qty }];
          return { items, bump: s.bump + 1 };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          items: qty <= 0 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, 20) } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "gg-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const MAX_COMPARE = 3;

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  image: string | null;
}

interface CompareState {
  items: CompareItem[];
  toggle: (item: CompareItem) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const { items } = get();
        if (items.some((i) => i.id === item.id)) {
          set({ items: items.filter((i) => i.id !== item.id) });
          return "removed";
        }
        if (items.length >= MAX_COMPARE) return "full";
        set({ items: [...items, item] });
        return "added";
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "gg-compare", storage: createJSONStorage(() => localStorage) },
  ),
);

interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
}

export const useToast = create<ToastState>()((set, get) => ({
  message: null,
  id: 0,
  show: (message) => {
    const id = get().id + 1;
    set({ message, id });
    setTimeout(() => {
      if (get().id === id) set({ message: null });
    }, 2200);
  },
}));

/** Avoid hydration mismatches for persisted stores. */
export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
