import { conditionLabel } from "./catalog";
import type { CartItem, CompareItem } from "./stores";
import type { Product, Variant } from "./types";
import type { OrderLine } from "./whatsapp";

export function conditionNote(p: Product, v: Variant): string | null {
  if (p.condition !== "uk_used") return null;
  const parts = ["UK-used"];
  if (v.grade) parts.push(`Grade ${v.grade}`);
  if (v.battery_health != null) parts.push(`${v.battery_health}% battery`);
  return parts.join(", ");
}

export function toCartItem(p: Product, v: Variant): Omit<CartItem, "qty"> {
  return {
    key: v.id,
    productId: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0] ?? null,
    category: p.category,
    storage: v.storage,
    colour: v.colour,
    conditionNote: conditionNote(p, v),
    chip: conditionLabel(p, v),
    unitPrice: v.price,
  };
}

export function toCompareItem(p: Product): CompareItem {
  return { id: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null };
}

export function toOrderLine(i: Pick<CartItem, "name" | "storage" | "colour" | "conditionNote" | "qty" | "unitPrice">): OrderLine {
  return { name: i.name, storage: i.storage, colour: i.colour, conditionNote: i.conditionNote, qty: i.qty, unitPrice: i.unitPrice };
}
