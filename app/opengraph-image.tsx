import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@/lib/og";

export const alt = "Gucci Gadgets — Original phones. Honest grades. Lagos prices.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(<OgCard title="Original phones. Honest grades. Lagos prices." subtitle="New and UK-used phones, tested and graded. Swaps and repairs." />, size);
}
