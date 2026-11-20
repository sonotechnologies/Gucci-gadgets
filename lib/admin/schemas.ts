import { z } from "zod";
import { BRANDS, REPAIR_ISSUES, TAGS } from "../types";

const naira = z.coerce.number().int("Whole naira only").min(0, "Can't be negative").max(100_000_000);
const optNaira = z.preprocess((v) => (v === "" || v == null ? null : v), naira.nullable());
const optInt = (min: number, max: number) => z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(min).max(max).nullable());
const optText = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(500).nullable());

export const variantSchema = z.object({
  id: z.string().optional(),
  storage: optText,
  colour: optText,
  price: naira,
  old_price: optNaira,
  in_stock: z.boolean(),
  stock_qty: z.coerce.number().int().min(0).max(10_000),
  grade: z.preprocess((v) => (v === "" ? null : v), z.enum(["A+", "A", "B"]).nullable()),
  battery_health: optInt(0, 100),
  warranty_months: optInt(0, 60),
  notes: optText,
});

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Enter a product name").max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
      .max(140),
    brand: z.enum(BRANDS),
    category: z.enum(["phone", "accessory", "gadget"]),
    condition: z.enum(["new", "uk_used"]),
    description: z.string().trim().max(2000),
    specs: z.record(z.string(), z.union([z.string(), z.number()])),
    images: z.array(z.string().url()).max(12),
    tags: z.array(z.enum(TAGS as [string, ...string[]])),
    deal_ends_at: z.preprocess((v) => (v === "" ? null : v), z.string().datetime({ offset: true }).nullable()),
    is_active: z.boolean(),
    variants: z.array(variantSchema).min(1, "Add at least one variant"),
  })
  .superRefine((p, ctx) => {
    if (p.condition === "uk_used") {
      p.variants.forEach((v, i) => {
        if (!v.grade) ctx.addIssue({ code: "custom", path: ["variants", i, "grade"], message: "UK-used variants need a grade" });
        if (v.battery_health == null) ctx.addIssue({ code: "custom", path: ["variants", i, "battery_health"], message: "Add battery health" });
      });
    }
  });
export type ProductInput = z.infer<typeof productSchema>;

export const swapValueSchema = z.object({
  id: z.string().optional(),
  brand: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(80),
  storage: z.string().trim().min(1).max(20),
  base_value: naira,
  is_active: z.boolean(),
});

export const repairPriceSchema = z.object({
  id: z.string().optional(),
  brand: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(80),
  issue: z.enum(REPAIR_ISSUES),
  price_from: naira,
  duration: z.string().trim().min(1).max(40),
});

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .transform((d) => (d.startsWith("0") && d.length === 11 ? "234" + d.slice(1) : d))
    .pipe(z.string().regex(/^234\d{10}$/, "Use a Nigerian number, e.g. 0913 092 8293")),
  store_address: z.string().trim().min(3).max(200),
  opening_hours: z.string().trim().min(3).max(120),
  delivery_note: z.string().trim().min(3).max(300),
  instagram_handle: z
    .string()
    .trim()
    .transform((s) => s.replace(/^@/, ""))
    .pipe(z.string().max(60)),
});
