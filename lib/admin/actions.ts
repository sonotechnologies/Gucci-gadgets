"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../supabase/config";
import { serverClient } from "../supabase/server";
import { productSchema, repairPriceSchema, settingsSchema, swapValueSchema } from "./schemas";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const DEMO: ActionResult = {
  ok: false,
  error: "Demo mode: connect Supabase (see README) to save changes. Nothing was saved.",
};

/** Every write needs the signed-in owner. RLS enforces this too. */
async function owner() {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return sb;
}

/** Push admin edits to the live site straight away. */
function refresh() {
  revalidatePath("/", "layout");
}

function zodErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.map(String).join(".")] ??= i.message;
  return out;
}

export async function saveProduct(input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { id, variants, ...product } = parsed.data;

  let productId = id;
  if (productId) {
    const { error } = await sb.from("products").update(product).eq("id", productId);
    if (error) return { ok: false, error: error.message.includes("duplicate") ? "That URL slug is already used." : error.message };
  } else {
    const { data, error } = await sb.from("products").insert(product).select("id").single();
    if (error) return { ok: false, error: error.message.includes("duplicate") ? "That URL slug is already used." : error.message };
    productId = data.id as string;
  }

  // Replace variants: keep ids that still exist, delete removed ones.
  const keep = variants.filter((v) => v.id).map((v) => v.id!);
  const del = sb.from("variants").delete().eq("product_id", productId);
  const { error: delErr } = keep.length ? await del.not("id", "in", `(${keep.join(",")})`) : await del;
  if (delErr) return { ok: false, error: delErr.message };
  const rows = variants.map((v) => {
    const { id: vid, ...rest } = v;
    return { ...(vid ? { id: vid } : {}), ...rest, product_id: productId };
  });
  const { error: upErr } = await sb.from("variants").upsert(rows);
  if (upErr) return { ok: false, error: upErr.message };

  refresh();
  return { ok: true, id: productId };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  redirect("/admin/products");
}

/** Quick in-stock toggle for every variant of a product. */
export async function setProductInStock(id: string, inStock: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("variants").update({ in_stock: inStock }).eq("product_id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setProductActive(id: string, active: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("products").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Inline edit of one variant's price / stock. */
export async function updateVariantQuick(id: string, patch: { price?: number; in_stock?: boolean; stock_qty?: number }): Promise<ActionResult> {
  if (patch.price != null && (!Number.isInteger(patch.price) || patch.price < 0)) return { ok: false, error: "Enter a whole naira amount" };
  if (patch.stock_qty != null && (!Number.isInteger(patch.stock_qty) || patch.stock_qty < 0)) return { ok: false, error: "Enter a whole number" };
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("variants").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function saveSwapValue(input: unknown): Promise<ActionResult> {
  const parsed = swapValueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid value" };
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { id, ...row } = parsed.data;
  const { data, error } = id
    ? await sb.from("swap_values").update(row).eq("id", id).select("id").single()
    : await sb.from("swap_values").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message.includes("duplicate") ? "That model and storage already exist." : error.message };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function deleteSwapValue(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("swap_values").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function saveRepairPrice(input: unknown): Promise<ActionResult> {
  const parsed = repairPriceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid value" };
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { id, ...row } = parsed.data;
  const { data, error } = id
    ? await sb.from("repair_prices").update(row).eq("id", id).select("id").single()
    : await sb.from("repair_prices").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function deleteRepairPrice(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("repair_prices").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return DEMO;
  const sb = await owner();
  const { error } = await sb.from("settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const sb = await serverClient();
    await sb.auth.signOut();
  }
  redirect("/admin/login");
}
