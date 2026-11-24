import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare-view";
import { isPhone } from "@/lib/catalog";
import { getProducts } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Compare phones",
  description: "Compare up to three phones side by side: display, chip, cameras, battery and condition, with the differences highlighted.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const phones = (await getProducts()).filter(isPhone);
  const has = (s: string) => phones.some((p) => p.slug === s);
  // One-tap suggestions shown when nothing is selected (only pairs that exist in the catalogue).
  const suggestions = [
    ["iphone-17-pro", "galaxy-s25-ultra"],
    ["iphone-16-pro-max-uk-used", "iphone-17-pro-max"],
    ["pixel-10", "iphone-17", "galaxy-a56"],
  ].filter((pair) => pair.filter(has).length >= 2);

  return (
    <div className="container-site flex flex-col gap-6 py-6 pb-28 md:py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">Compare phones</h1>
        <p className="text-body text-muted">Side by side, with the differences highlighted.</p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-card bg-surface" />}>
        <CompareView phones={phones} suggestions={suggestions} />
      </Suspense>
    </div>
  );
}
