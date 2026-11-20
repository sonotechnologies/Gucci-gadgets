"use client";
import { PRODUCT_IMAGE_BUCKET } from "../supabase/config";
import { browserClient } from "../supabase/browser";

/** Resize to max 1600px and re-encode as WebP (~0.82) in the browser before upload. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob) throw new Error("Could not compress image");
  return blob;
}

export async function uploadProductImage(file: File, slug: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  const blob = await compressImage(file);
  const path = `${slug || "product"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const sb = browserClient();
  const { error } = await sb.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
