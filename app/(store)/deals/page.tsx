import { Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyStateStatic } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Countdown } from "@/components/ui";
import { isDealActive, isNewArrival, isPriceDropProduct } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import type { Product } from "@/lib/types";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Deals, new arrivals and price drops",
  description: "Flash deals with countdowns, phones that just landed, and the latest price drops at Gucci Gadgets, Lagos.",
  alternates: { canonical: "/deals" },
};

function Grid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default async function DealsPage() {
  const all = await getProducts();
  const now = Date.now();
  const deals = all.filter((p) => isDealActive(p, now));
  const dealIds = new Set(deals.map((p) => p.id));
  const landed = all.filter((p) => isNewArrival(p, now)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const drops = all.filter((p) => isPriceDropProduct(p) && !dealIds.has(p.id));
  const nextEnd = deals
    .map((p) => p.deal_ends_at)
    .filter((d): d is string => !!d && new Date(d).getTime() > now)
    .sort()[0];

  return (
    <div className="container-site flex flex-col gap-12 py-6 md:gap-16 md:py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">Deals</h1>
        <p className="text-body text-muted">Flash deals, new arrivals and price drops. Stock is limited, so prices hold while units last.</p>
      </div>

      <section className="flex flex-col gap-5" aria-labelledby="flash">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="flash" className="h-section">
            Flash deals
          </h2>
          {nextEnd && <Countdown endsAt={nextEnd} />}
        </div>
        {deals.length ? (
          <Grid items={deals} />
        ) : (
          <EmptyStateStatic icon={<Tag size={32} strokeWidth={1.25} />} title="No flash deals right now" body="New deals drop most weeks. Check back soon or follow us on Instagram." />
        )}
      </section>

      {landed.length > 0 && (
        <section className="flex flex-col gap-5" aria-labelledby="landed">
          <h2 id="landed" className="h-section">
            Just landed
          </h2>
          <Grid items={landed} />
        </section>
      )}

      {drops.length > 0 && (
        <section className="flex flex-col gap-5" aria-labelledby="drops">
          <h2 id="drops" className="h-section">
            Price drops
          </h2>
          <Grid items={drops} />
        </section>
      )}

      <Link href="/shop" className="btn btn-secondary btn-lg self-center hover:no-underline">
        Browse everything
      </Link>
    </div>
  );
}
