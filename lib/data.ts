import "server-only";
import { cache } from "react";
import { publicClient } from "./supabase/public";
import { SEED_PRODUCTS, SEED_REPAIR_PRICES, SEED_REVIEWS, SEED_SETTINGS, SEED_SWAP_VALUES } from "./seed";
import type { Product, RepairPrice, Review, Settings, SwapValue } from "./types";

/**
 * Catalogue reads. With Supabase configured they query Postgres through the
 * anon key (RLS: public read). Without it they return the seed data, so the
 * site runs end to end as a demo.
 */

function normalise(p: Product): Product {
  return {
    ...p,
    images: p.images ?? [],
    tags: p.tags ?? [],
    specs: p.specs ?? {},
    variants: (p.variants ?? []).map((v) => ({ ...v, price: Number(v.price), old_price: v.old_price == null ? null : Number(v.old_price) })),
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const sb = publicClient();
  if (!sb) return SEED_PRODUCTS.filter((p) => p.is_active);
  const { data, error } = await sb
    .from("products")
    .select("*, variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as Product[]).map(normalise);
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
});

export const getSwapValues = cache(async (): Promise<SwapValue[]> => {
  const sb = publicClient();
  if (!sb) return SEED_SWAP_VALUES.filter((s) => s.is_active);
  const { data, error } = await sb.from("swap_values").select("*").eq("is_active", true).order("brand").order("model");
  if (error) throw new Error(`Could not load swap values: ${error.message}`);
  return (data as SwapValue[]).map((s) => ({ ...s, base_value: Number(s.base_value) }));
});

export const getRepairPrices = cache(async (): Promise<RepairPrice[]> => {
  const sb = publicClient();
  if (!sb) return SEED_REPAIR_PRICES;
  const { data, error } = await sb.from("repair_prices").select("*").order("brand").order("model");
  if (error) throw new Error(`Could not load repair prices: ${error.message}`);
  return (data as RepairPrice[]).map((r) => ({ ...r, price_from: Number(r.price_from) }));
});

export const getSettings = cache(async (): Promise<Settings> => {
  const sb = publicClient();
  if (!sb) return SEED_SETTINGS;
  const { data } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  return { ...SEED_SETTINGS, ...(data ?? {}) };
});

export const getReviews = cache(async (): Promise<Review[]> => {
  const sb = publicClient();
  if (!sb) return SEED_REVIEWS;
  const { data } = await sb.from("reviews").select("*").order("created_at");
  return (data as Review[] | null) ?? SEED_REVIEWS;
});
