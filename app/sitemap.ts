import type { MetadataRoute } from "next";
import { CATEGORY_SLUGS } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();
  const statics = ["", "/shop", "/deals", "/swap", "/repairs", "/compare", "/about", ...Object.keys(CATEGORY_SLUGS).map((c) => `/shop/${c}`)];
  return [
    ...statics.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: new Date(p.created_at), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
