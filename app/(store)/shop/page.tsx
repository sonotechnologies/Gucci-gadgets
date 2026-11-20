import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Shop phones, accessories and gadgets",
  description: "New and UK-used iPhones, Samsung, Pixel, Tecno, Infinix and Redmi phones in Lagos. Filter by brand, condition, storage and price.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={await searchParams} />;
}
