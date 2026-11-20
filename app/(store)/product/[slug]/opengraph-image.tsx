import { ImageResponse } from "next/og";
import { conditionLabel, fromPrice } from "@/lib/catalog";
import { getProductBySlug } from "@/lib/data";
import { formatNaira } from "@/lib/format";
import { OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Gucci Gadgets product";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function ProductOg({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return new ImageResponse(<OgCard title="Gucci Gadgets" subtitle="Original phones. Honest grades. Lagos prices." />, size);
  return new ImageResponse(
    <OgCard title={p.name} subtitle={p.description.slice(0, 90)} price={`from ${formatNaira(fromPrice(p))}`} badge={conditionLabel(p)} />,
    size,
  );
}
