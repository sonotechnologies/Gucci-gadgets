import { ChevronLeft, Repeat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/product/buy-box";
import { Gallery } from "@/components/product/gallery";
import { ProductCard } from "@/components/product-card";
import { baseVariant, CATEGORY_SLUGS, conditionLabel, fromPrice, isInStock, isPhone, SPEC_LABELS, specValue } from "@/lib/catalog";
import { getProductBySlug, getProducts } from "@/lib/data";
import { formatNaira } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Product } from "@/lib/types";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const title = `${p.name} (${conditionLabel(p)})`;
  const description = `${p.name}, ${conditionLabel(p).toLowerCase()}, from ${formatNaira(fromPrice(p))} in Lagos. ${p.description}`.slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `/product/${p.slug}` },
  };
}

function related(all: Product[], p: Product): Product[] {
  const price = fromPrice(p);
  return all
    .filter((x) => x.id !== p.id && x.category === p.category)
    .map((x) => ({ x, score: (x.brand === p.brand ? 0 : 1) + Math.abs(fromPrice(x) - price) / Math.max(price, 1) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((r) => r.x);
}

function categorySlugFor(p: Product): keyof typeof CATEGORY_SLUGS {
  if (p.category === "accessory") return "accessories";
  if (p.category === "gadget") return "gadgets";
  return p.condition === "uk_used" ? "uk-used" : "phones";
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [p, all] = await Promise.all([getProductBySlug(slug), getProducts()]);
  if (!p) notFound();
  const v = baseVariant(p);
  const specs = Object.entries(p.specs).filter(([, val]) => val != null && val !== "");
  const rel = related(all, p);
  const cat = categorySlugFor(p);

  const prices = p.variants.map((x) => x.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images,
    sku: p.id,
    brand: { "@type": "Brand", name: p.brand },
    itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "NGN",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: isInStock(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.slug}`,
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  return (
    <div className="container-site flex flex-col gap-12 pb-28 pt-4 md:gap-16 md:pb-16 md:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="flex flex-col gap-4">
        <Link href={`/shop/${cat}`} className="flex h-9 items-center gap-1.5 self-start text-small text-muted hover:text-text hover:no-underline">
          <ChevronLeft size={16} strokeWidth={1.5} />
          {CATEGORY_SLUGS[cat].label}
        </Link>
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <Gallery images={p.images} name={p.name} category={p.category} />
          <BuyBox product={p} />
        </div>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="h-section">{specs.length ? "Specs" : "About this product"}</h2>
          <p className="text-body leading-relaxed text-muted">{p.description}</p>
          {specs.length > 0 && (
            <dl className="flex flex-col">
              {specs.map(([k, val]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-4 border-b border-border py-3.5 text-[15px] md:grid-cols-[140px_1fr]">
                  <dt className="text-muted">{SPEC_LABELS[k] ?? k}</dt>
                  <dd>{specValue(k, val)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        {isPhone(p) && v && (
          <section className="flex flex-col items-start gap-3 rounded-card bg-accent-soft p-6">
            <Repeat size={24} strokeWidth={1.5} className="text-accent" />
            <h2 className="text-h3 font-semibold">Swap your old phone for this</h2>
            <p className="text-[15px] leading-normal text-muted">Trade in your current phone and pay only the difference. Estimates take under a minute.</p>
            <Link href={`/swap?target=${p.slug}`} className="btn btn-primary hover:no-underline">
              Get a swap estimate
            </Link>
          </section>
        )}
      </div>

      {rel.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="h-section">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
            {rel.map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
