"use client";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { activeFilterCount, filtersToQuery, type Facets, type ShopFilters, type SortKey } from "@/lib/filters";
import { formatNaira } from "@/lib/format";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function Chip({ on, onClick, children, mono }: { on: boolean; onClick: () => void; children: React.ReactNode; mono?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-10 rounded-full border px-4 text-small font-medium transition-colors duration-150",
        mono && "font-mono",
        on ? "border-accent bg-accent-soft text-text" : "border-border bg-bg text-text hover:bg-surface",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-b border-border pb-5">
      <legend className="mb-3 text-small font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Price range: two linked range sliders (dual-thumb) plus readout. */
function PriceRange({ f, facets, onChange }: { f: ShopFilters; facets: Facets; onChange: (min: number | null, max: number | null) => void }) {
  const lo = facets.priceMin;
  const hi = facets.priceMax;
  const [vals, setVals] = useState<[number, number]>([f.min ?? lo, f.max ?? hi]);
  useEffect(() => setVals([f.min ?? lo, f.max ?? hi]), [f.min, f.max, lo, hi]);
  const step = 5000;
  const commit = (a: number, b: number) => onChange(a <= lo ? null : a, b >= hi ? null : b);
  const pct = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${pct(vals[0])}%`, right: `${100 - pct(vals[1])}%` }} />
        {[0, 1].map((i) => (
          <input
            key={i}
            type="range"
            min={lo}
            max={hi}
            step={step}
            value={vals[i]}
            aria-label={i === 0 ? "Minimum price" : "Maximum price"}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVals((cur) => (i === 0 ? [Math.min(v, cur[1] - step), cur[1]] : [cur[0], Math.max(v, cur[0] + step)]));
            }}
            onPointerUp={() => commit(vals[0], vals[1])}
            onKeyUp={() => commit(vals[0], vals[1])}
            className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          />
        ))}
      </div>
      <div className="num flex justify-between text-[13px] text-muted">
        <span>{formatNaira(vals[0])}</span>
        <span>{formatNaira(vals[1])}</span>
      </div>
    </div>
  );
}

export function FiltersPanel({
  filters,
  facets,
  fixedCategory,
  resultCount,
  children,
}: {
  filters: ShopFilters;
  facets: Facets;
  fixedCategory?: CategorySlug;
  resultCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState(false);
  const includeCategory = !fixedCategory;

  const update = (patch: Partial<ShopFilters>) => {
    const next = { ...filters, ...patch };
    start(() => router.replace(`${pathname}${filtersToQuery(next, includeCategory)}`, { scroll: false }));
  };
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const count = activeFilterCount(filters, includeCategory);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const body = (
    <div className="flex flex-col gap-5">
      {includeCategory && (
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_SLUGS) as CategorySlug[]).map((c) => (
              <Chip key={c} on={filters.category === c} onClick={() => update({ category: filters.category === c ? null : c })}>
                {CATEGORY_SLUGS[c].short}
              </Chip>
            ))}
          </div>
        </Group>
      )}
      {!fixedCategory && (
        <Group title="Condition">
          <div className="flex flex-wrap gap-2">
            <Chip on={filters.condition === "new"} onClick={() => update({ condition: filters.condition === "new" ? null : "new" })}>
              New
            </Chip>
            <Chip on={filters.condition === "uk_used"} onClick={() => update({ condition: filters.condition === "uk_used" ? null : "uk_used" })}>
              UK-used
            </Chip>
          </div>
        </Group>
      )}
      <Group title="Brand">
        <div className="flex flex-wrap gap-2">
          {facets.brands.map((b) => (
            <Chip key={b} on={filters.brands.includes(b)} onClick={() => update({ brands: toggle(filters.brands, b) })}>
              {b}
            </Chip>
          ))}
        </div>
      </Group>
      {facets.priceMax > facets.priceMin && (
        <Group title="Price">
          <PriceRange f={filters} facets={facets} onChange={(min, max) => update({ min, max })} />
        </Group>
      )}
      {facets.storages.length > 0 && (
        <Group title="Storage">
          <div className="flex flex-wrap gap-2">
            {facets.storages.map((s) => (
              <Chip key={s} mono on={filters.storage.includes(s)} onClick={() => update({ storage: toggle(filters.storage, s) })}>
                {s}
              </Chip>
            ))}
          </div>
        </Group>
      )}
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-small font-medium">
        In stock only
        <input type="checkbox" checked={filters.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
      </label>
      {count > 0 && (
        <button
          type="button"
          onClick={() => update({ category: fixedCategory ?? null, brands: [], condition: null, min: null, max: null, storage: [], inStock: false })}
          className="btn btn-ghost self-start px-0 text-muted"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24">{body}</div>
      </aside>
      <div className="flex min-w-0 flex-col gap-5">
        {/* Toolbar: result count, sort, mobile filter button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={cn("text-small text-muted transition-opacity", pending && "opacity-50")} aria-live="polite">
            {resultCount} {resultCount === 1 ? "product" : "products"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSheet(true)} className="btn btn-secondary lg:hidden">
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              Filters{count > 0 && <span className="num rounded-full bg-accent px-1.5 text-micro text-on-accent">{count}</span>}
            </button>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select id="sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortKey })} className="input h-11 w-auto pr-8 text-small">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={cn("transition-opacity duration-150", pending && "opacity-60")}>{children}</div>
      </div>

      {/* Mobile bottom sheet */}
      {sheet && (
        <>
          <div className="fixed inset-0 z-50 animate-fade bg-scrim lg:hidden" onClick={() => setSheet(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-x-0 bottom-0 z-[51] flex max-h-[88vh] animate-rise flex-col rounded-t-2xl bg-bg lg:hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-h3 font-semibold">Filters</span>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close filters" className="icon-btn -mr-3">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{body}</div>
            <div className="border-t border-border px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={() => setSheet(false)} className="btn btn-primary btn-lg w-full">
                Show {resultCount} {resultCount === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
