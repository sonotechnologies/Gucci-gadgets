import "server-only";
import { SEED_PRODUCTS, SEED_REPAIR_PRICES, SEED_SETTINGS, SEED_SWAP_VALUES } from "../seed";
import { isSupabaseConfigured } from "../supabase/config";
import { serverClient } from "../supabase/server";
import type { Product, RepairPrice, Settings, SwapValue } from "../types";

/** Admin reads include inactive products and swap values. */

export async function adminProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return SEED_PRODUCTS;
  const sb = await serverClient();
  const { data, error } = await sb.from("products").select("*, variants(*)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Product[];
}

export async function adminProduct(id: string): Promise<Product | null> {
  return (await adminProducts()).find((p) => p.id === id) ?? null;
}

export async function adminSwapValues(): Promise<SwapValue[]> {
  if (!isSupabaseConfigured) return SEED_SWAP_VALUES;
  const sb = await serverClient();
  const { data, error } = await sb.from("swap_values").select("*").order("brand").order("model").order("storage");
  if (error) throw new Error(error.message);
  return data as SwapValue[];
}

export async function adminRepairPrices(): Promise<RepairPrice[]> {
  if (!isSupabaseConfigured) return SEED_REPAIR_PRICES;
  const sb = await serverClient();
  const { data, error } = await sb.from("repair_prices").select("*").order("brand").order("model").order("issue");
  if (error) throw new Error(error.message);
  return data as RepairPrice[];
}

export async function adminSettings(): Promise<Settings> {
  if (!isSupabaseConfigured) return SEED_SETTINGS;
  const sb = await serverClient();
  const { data } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  return { ...SEED_SETTINGS, ...(data ?? {}) };
}

export async function adminUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  return data.user?.email ?? null;
}
