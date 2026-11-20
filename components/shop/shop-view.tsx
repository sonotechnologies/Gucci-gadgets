import { SearchX } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { EmptyStateStatic } from "@/components/empty-state";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { applyFilters, facets, parseFilters } from "@/lib/filters";
import { FiltersPanel } from "./filters-panel";

type Params = Record<string, string | string[] | undefined>;

export async function ShopView({ searchParams, category }: { searchParams: Params; category?: CategorySlug }) {
  const all = await getProducts();
  const filters = parseFilters(searchParams, category);
  // Facets come from the products in scope (the fixed category, if any).
  const scope = category ? applyFilters(all, { ...parseFilters({}, category) }) : all;
  const results = applyFilters(all, filters);
  const title = category ? CATEGORY_SLUGS[category].label : "All products";

  return (
    <div className="container-site flex flex-col gap-6 py-6 md:py-10">
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="flex gap-1.5 text-small text-muted">
          <Link href="/" className="text-muted hover:text-text">
            Home
          </Link>
          <span>/</span>
          {category ? (
            <>
              <Link href="/shop" className="text-muted hover:text-text">
                Shop
              </Link>
              <span>/</span>
              <span className="text-text">{CATEGORY_SLUGS[category].short}</span>
            </>
          ) : (
            <span className="text-text">Shop</span>
          )}
        </nav>
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">{title}</h1>
        {!category && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {(Object.keys(CATEGORY_SLUGS) as CategorySlug[]).map((c) => (
              <Link key={c} href={`/shop/${c}`} className="flex h-10 shrink-0 items-center rounded-full border border-border px-4 text-small font-medium text-text hover:bg-surface hover:no-underline">
                {CATEGORY_SLUGS[c].short}
              </Link>
            ))}
          </div>
        )}
      </div>
      <FiltersPanel filters={filters} facets={facets(scope)} fixedCategory={category} resultCount={results.length}>
        {results.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyStateStatic
            icon={<SearchX size={32} strokeWidth={1.25} />}
            title="Nothing matches those filters"
            body="Try removing a filter, or ask us on WhatsApp. We can usually source a phone within 48 hours."
          />
        )}
      </FiltersPanel>
    </div>
  );
}
