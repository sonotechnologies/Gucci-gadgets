/**
 * Prints the render spec for every seed product as JSON (used by
 * scripts/gen-product-images.py). Run: npx tsx scripts/product-image-spec.ts
 */
import { colours, swatchHex } from "../lib/catalog";
import { SEED_PRODUCTS } from "../lib/seed";

function kind(name: string, brand: string, category: string): string {
  const n = name.toLowerCase();
  if (category === "phone") {
    if (brand === "Google") return "phone-bar";
    if (brand === "Samsung") return "phone-column";
    if (brand === "Apple") return /pro/.test(n) ? "phone-triple" : "phone-dual";
    return "phone-ring";
  }
  if (n.includes("airpods")) return "earbuds";
  if (n.includes("magsafe power")) return "magsafe-bank";
  if (n.includes("power bank")) return "power-bank";
  if (n.includes("charger")) return n.includes("35w") ? "charger-dual" : "charger";
  if (n.includes("case")) return "case";
  if (n.includes("protector")) return "protector";
  if (n.includes("watch")) return "watch";
  if (n.includes("speaker")) return "speaker";
  return "box";
}

const spec = SEED_PRODUCTS.map((p) => {
  const cols = colours(p);
  return {
    slug: p.slug,
    kind: kind(p.name, p.brand, p.category),
    big: /max|ultra|plus|note/i.test(p.name),
    colours: (cols.length ? cols : ["Black"]).map((c) => (c === "Clear" ? "clear" : swatchHex(c))),
    count: p.category === "phone" ? 3 : 1,
  };
});

process.stdout.write(JSON.stringify(spec, null, 2));
