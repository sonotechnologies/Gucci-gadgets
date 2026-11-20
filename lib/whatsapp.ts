import { formatNaira } from "./format";

export const LAGOS_AREAS = [
  "Lekki",
  "Ajah",
  "Victoria Island",
  "Ikoyi",
  "Yaba",
  "Surulere",
  "Ikeja",
  "Gbagada",
  "Maryland",
  "Magodo",
  "Festac",
  "Ikorodu",
  "Outside Lagos",
] as const;

export type DeliveryMode = "Delivery" | "Pickup";

export function waLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** Local display format: 2349130928293 → "0913 092 8293". */
export function displayPhone(number: string): string {
  const d = number.replace(/\D/g, "");
  const local = d.startsWith("234") ? "0" + d.slice(3) : d;
  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

export interface OrderLine {
  name: string;
  storage: string | null;
  colour: string | null;
  conditionNote: string | null; // e.g. "UK-used, Grade A, 92% battery"
  qty: number;
  unitPrice: number;
}

export function lineLabel(l: OrderLine): string {
  const opts = [l.storage, l.colour].filter(Boolean).join(", ");
  return `${l.name}${opts ? ` — ${opts}` : ""}${l.conditionNote ? ` (${l.conditionNote})` : ""}`;
}

/** Build Brief §5.3 message format. */
export function orderMessage(
  lines: OrderLine[],
  customer: { name: string; phone: string; area: string; mode: DeliveryMode },
): string {
  const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const out = ["Hello Gucci Gadgets 👋", "I'd like to order:"];
  lines.forEach((l, i) => out.push(`${i + 1}. ${lineLabel(l)} × ${l.qty} — ${formatNaira(l.unitPrice * l.qty)}`));
  out.push(`Total: ${formatNaira(total)}`);
  out.push(`Name: ${customer.name.trim() || "…"}`);
  out.push(`Phone: ${customer.phone.trim() || "…"}`);
  out.push(customer.mode === "Pickup" ? "Delivery: Pickup at the store" : `Delivery: ${customer.area} (Delivery)`);
  return out.join("\n");
}

export function singleProductMessage(line: OrderLine): string {
  return [
    "Hello Gucci Gadgets 👋",
    "I'd like to order:",
    `1. ${lineLabel(line)} × ${line.qty} — ${formatNaira(line.unitPrice * line.qty)}`,
    "Is it available?",
  ].join("\n");
}
