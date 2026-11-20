import { fromPrice, isInStock, matchesCategorySlug, storages, CATEGORY_SLUGS, type CategorySlug } from "./catalog";
import { storageRank } from "./format";
import type { Product } from "./types";

export type SortKey = "newest" | "price_asc" | "price_desc";

export interface ShopFilters {
  category: CategorySlug | null;
  brands: string[];
  condition: "new" | "uk_used" | null;
  min: number | null;
  max: number | null;
  storage: string[];
  inStock: boolean;
  sort: SortKey;
}

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
const num = (v: string | string[] | undefined): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function parseFilters(sp: Params, fixedCategory?: CategorySlug): ShopFilters {
  const cat = (Array.isArray(sp.category) ? sp.category[0] : sp.category) as CategorySlug | undefined;
  const cond = Array.isArray(sp.condition) ? sp.condition[0] : sp.condition;
  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as SortKey | undefined;
  return {
    category: fixedCategory ?? (cat && cat in CATEGORY_SLUGS ? cat : null),
    brands: list(sp.brand),
    condition: cond === "new" || cond === "uk_used" ? cond : null,
    min: num(sp.min),
    max: num(sp.max),
    storage: list(sp.storage),
    inStock: sp.stock === "1",
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
  };
}

export function filtersToQuery(f: ShopFilters, includeCategory: boolean): string {
  const q = new URLSearchParams();
  if (includeCategory && f.category) q.set("category", f.category);
  if (f.brands.length) q.set("brand", f.brands.join(","));
  if (f.condition) q.set("condition", f.condition);
  if (f.min) q.set("min", String(f.min));
  if (f.max) q.set("max", String(f.max));
  if (f.storage.length) q.set("storage", f.storage.join(","));
  if (f.inStock) q.set("stock", "1");
  if (f.sort !== "newest") q.set("sort", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function applyFilters(products: Product[], f: ShopFilters): Product[] {
  const out = products.filter((p) => {
    if (f.category && !matchesCategorySlug(p, f.category)) return false;
    if (f.brands.length && !f.brands.includes(p.brand)) return false;
    if (f.condition && p.condition !== f.condition) return false;
    const price = fromPrice(p);
    if (f.min && price < f.min) return false;
    if (f.max && price > f.max) return false;
    if (f.storage.length && !storages(p).some((s) => f.storage.includes(s))) return false;
    if (f.inStock && !isInStock(p)) return false;
    return true;
  });
  return out.sort((a, b) => {
    if (f.sort === "price_asc") return fromPrice(a) - fromPrice(b);
    if (f.sort === "price_desc") return fromPrice(b) - fromPrice(a);
    return b.created_at.localeCompare(a.created_at);
  });
}

export function activeFilterCount(f: ShopFilters, includeCategory: boolean): number {
  return (
    (includeCategory && f.category ? 1 : 0) +
    f.brands.length +
    (f.condition ? 1 : 0) +
    (f.min || f.max ? 1 : 0) +
    f.storage.length +
    (f.inStock ? 1 : 0)
  );
}

/** Facet options computed from the catalogue so the UI never offers an empty choice. */
export function facets(products: Product[]) {
  const prices = products.map(fromPrice).filter((n) => n > 0);
  return {
    brands: [...new Set(products.map((p) => p.brand))].sort(),
    storages: [...new Set(products.flatMap(storages))].sort((a, b) => storageRank(a) - storageRank(b)),
    priceMin: prices.length ? Math.floor(Math.min(...prices) / 5000) * 5000 : 0,
    priceMax: prices.length ? Math.ceil(Math.max(...prices) / 50000) * 50000 : 0,
  };
}
export type Facets = ReturnType<typeof facets>;
