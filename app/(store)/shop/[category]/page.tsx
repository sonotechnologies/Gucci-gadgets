import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/catalog";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = CATEGORY_SLUGS[category as CategorySlug];
  if (!c) return {};
  return {
    title: c.label,
    description: `${c.label} at Gucci Gadgets, Lagos. Honest grades, warranty and WhatsApp ordering.`,
    alternates: { canonical: `/shop/${category}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!(category in CATEGORY_SLUGS)) notFound();
  return <ShopView searchParams={await searchParams} category={category as CategorySlug} />;
}
