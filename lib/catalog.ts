import { storageRank } from "./format";
import type { Grade, Product, Variant } from "./types";

export const NEW_ARRIVAL_DAYS = 14;

export function sortedVariants(p: Product): Variant[] {
  return [...p.variants].sort((a, b) => a.price - b.price || storageRank(a.storage) - storageRank(b.storage));
}

/** Cheapest variant, preferring one that is in stock. */
export function baseVariant(p: Product): Variant | undefined {
  const v = sortedVariants(p);
  return v.find((x) => x.in_stock && x.stock_qty > 0) ?? v[0];
}

export function fromPrice(p: Product): number {
  return baseVariant(p)?.price ?? 0;
}

export function storages(p: Product): string[] {
  return [...new Set(p.variants.map((v) => v.storage).filter((s): s is string => !!s))].sort(
    (a, b) => storageRank(a) - storageRank(b),
  );
}

export function colours(p: Product): string[] {
  return [...new Set(p.variants.map((v) => v.colour).filter((c): c is string => !!c))];
}

export function findVariant(p: Product, storage: string | null, colour: string | null): Variant | undefined {
  return (
    p.variants.find((v) => v.storage === storage && v.colour === colour) ??
    p.variants.find((v) => v.storage === storage) ??
    p.variants.find((v) => v.colour === colour) ??
    baseVariant(p)
  );
}

export function isInStock(p: Product): boolean {
  return p.variants.some((v) => v.in_stock && v.stock_qty > 0);
}

export function variantInStock(v: Variant | undefined): boolean {
  return !!v && v.in_stock && v.stock_qty > 0;
}

/** Price drop is automatic whenever old_price is higher than price. */
export function hasPriceDrop(v: Variant | undefined): boolean {
  return !!v && v.old_price != null && v.old_price > v.price;
}

export function isDealActive(p: Product, now = Date.now()): boolean {
  if (!p.tags.includes("deal")) return false;
  if (!p.deal_ends_at) return true;
  return new Date(p.deal_ends_at).getTime() > now;
}

export function isNewArrival(p: Product, now = Date.now()): boolean {
  if (p.tags.includes("new_arrival")) return true;
  return now - new Date(p.created_at).getTime() < NEW_ARRIVAL_DAYS * 86_400_000;
}

export function isPriceDropProduct(p: Product): boolean {
  return p.tags.includes("price_drop") || p.variants.some(hasPriceDrop);
}

export function isPhone(p: Product): boolean {
  return p.category === "phone";
}

export function conditionLabel(p: Product, v?: Variant): string {
  if (p.condition === "new") return "New";
  const g = v?.grade ?? baseVariant(p)?.grade;
  return g ? `UK-used · ${g}` : "UK-used";
}

export function gradeTone(g: Grade | null | undefined): "success" | "warning" {
  return g === "B" ? "warning" : "success";
}

export function batteryTone(pct: number | null | undefined): "success" | "warning" | "deal" {
  if (pct == null) return "success";
  if (pct >= 90) return "success";
  if (pct >= 80) return "warning";
  return "deal";
}

export const GRADE_COPY: Record<Grade, string> = {
  "A+": "Looks and works like new. No marks you can see at arm's length.",
  A: "Excellent condition. At most a faint mark you'd only spot up close.",
  B: "Good condition. Light marks on the frame or back, hidden by a case. Screen is clean.",
};

export const CATEGORY_SLUGS = {
  phones: { label: "New phones", short: "Phones" },
  "uk-used": { label: "UK-used phones", short: "UK-used" },
  accessories: { label: "Accessories", short: "Accessories" },
  gadgets: { label: "Gadgets", short: "Gadgets" },
} as const;
export type CategorySlug = keyof typeof CATEGORY_SLUGS;

export function matchesCategorySlug(p: Product, slug: CategorySlug): boolean {
  switch (slug) {
    case "phones":
      return p.category === "phone" && p.condition === "new";
    case "uk-used":
      return p.category === "phone" && p.condition === "uk_used";
    case "accessories":
      return p.category === "accessory";
    case "gadgets":
      return p.category === "gadget";
  }
}

/** Specs grouped for the compare table (Design Brief §6 Compare). */
export const SPEC_GROUPS: { title: string; rows: { key: string; label: string }[] }[] = [
  { title: "DISPLAY", rows: [{ key: "display", label: "Screen" }] },
  {
    title: "PERFORMANCE",
    rows: [
      { key: "chip", label: "Chip" },
      { key: "ram", label: "RAM" },
      { key: "os", label: "Software" },
    ],
  },
  { title: "CAMERA", rows: [{ key: "camera", label: "Cameras" }] },
  { title: "BATTERY", rows: [{ key: "battery_mah", label: "Capacity" }] },
];

export const SPEC_LABELS: Record<string, string> = {
  display: "Display",
  chip: "Chip",
  ram: "RAM",
  camera: "Camera",
  battery_mah: "Battery",
  os: "Software",
  network: "Network",
  connectivity: "Connectivity",
  output: "Output",
  capacity: "Capacity",
  compatibility: "Works with",
  battery_life: "Battery life",
};

export function specValue(key: string, v: string | number | undefined): string {
  if (v == null || v === "") return "—";
  if (key === "battery_mah" && typeof v === "number") return `${v.toLocaleString("en-US")} mAh`;
  return String(v);
}

/** Colour swatch hex for common colour names (placeholder palette). */
export const SWATCHES: Record<string, string> = {
  "Natural Titanium": "#BFB6A8",
  "Desert Titanium": "#C8B39A",
  "Black Titanium": "#3A3A3C",
  "White Titanium": "#EDECE7",
  "Titanium Gray": "#8C8A86",
  "Titanium Black": "#2B2C30",
  "Titanium Silverblue": "#9DAAC0",
  "Cosmic Orange": "#E07A3F",
  "Deep Blue": "#3B4A6B",
  Silver: "#E3E4E6",
  Lavender: "#B9B2D9",
  Sage: "#A9B79B",
  "Mist Blue": "#A9C0D6",
  Natural: "#BFB6A8",
  Black: "#2B2C30",
  White: "#EDECE7",
  Blue: "#55698A",
  Pink: "#E6C4C8",
  Green: "#9DB59A",
  Ultramarine: "#3F51B5",
  Teal: "#4F8C8C",
  Midnight: "#232A35",
  Starlight: "#F2EDE4",
  "Space Black": "#2E2E30",
  "Deep Purple": "#5B4B6B",
  Gold: "#E6D3AE",
  Obsidian: "#232427",
  Porcelain: "#ECE8E1",
  Hazel: "#8C8A73",
  Indigo: "#4B5585",
  Graphite: "#4A4B4F",
  Violet: "#8E86B5",
  "Awesome Navy": "#2C3A5B",
  "Awesome Lilac": "#C3B5DD",
  Gray: "#8E9096",
};

export function swatchHex(name: string): string {
  return SWATCHES[name] ?? "#9AA0AC";
}
