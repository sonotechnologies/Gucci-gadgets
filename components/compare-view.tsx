"use client";
import { Check, GitCompare, Link2, Plus, Search, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { baseVariant, conditionLabel, storages } from "@/lib/catalog";
import { toCartItem, toCompareItem } from "@/lib/cart-item";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { MAX_COMPARE, useCart, useCompare, useHydrated, useToast } from "@/lib/stores";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { BatteryBar, ConditionChip, DealBadge, Switch } from "./ui";

// ---------- spec helpers ----------
const num = (s: unknown, re: RegExp): number | null => {
  const m = typeof s === "string" ? re.exec(s) : null;
  return m ? parseFloat(m[1]) : null;
};
const displayInches = (p: Product) => num(p.specs.display, /([\d.]+)"/);
const mainCameraMp = (p: Product) => num(p.specs.camera, /(\d+)MP/);
const batteryMah = (p: Product) => (typeof p.specs.battery_mah === "number" ? p.specs.battery_mah : null);
const price = (p: Product) => baseVariant(p)?.price ?? Infinity;

interface Row {
  label: string;
  values: React.ReactNode[];
  keys: string[]; // comparable text per column (for "differs")
}

function PhonePicker({ phones, exclude, onPick, onClose }: { phones: Product[]; exclude: string[]; onPick: (p: Product) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const list = phones.filter((p) => !exclude.includes(p.id) && (!q.trim() || `${p.name} ${p.brand} ${conditionLabel(p)}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <div className="fixed inset-0 z-[60] animate-fade bg-scrim" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a phone to compare"
        className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[80vh] animate-rise flex-col rounded-t-2xl bg-bg md:inset-x-auto md:bottom-auto md:left-1/2 md:top-24 md:w-[520px] md:-translate-x-1/2 md:rounded-card md:border md:border-border"
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <label className="relative flex-1">
            <span className="sr-only">Search phones</span>
            <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones" className="input pl-10" type="search" />
          </label>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {list.map((p) => (
            <button key={p.id} type="button" onClick={() => onPick(p)} className="flex w-full items-center gap-3 rounded-btn p-2 text-left hover:bg-surface">
              <ProductImage src={p.images[0]} alt="" sizes="56px" className="h-14 w-14 shrink-0 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-medium">{p.name}</span>
                <span className="text-micro text-muted">{conditionLabel(p)}</span>
              </span>
              <span className="num text-small">{formatNaira(price(p))}</span>
            </button>
          ))}
          {list.length === 0 && <p className="p-4 text-small text-muted">No phones match that search.</p>}
        </div>
      </div>
    </>
  );
}

export function CompareView({ phones, suggestions }: { phones: Product[]; suggestions: string[][] }) {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const toggle = useCompare((s) => s.toggle);
  const clear = useCompare((s) => s.clear);
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [hl, setHl] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [picker, setPicker] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const miniHeader = useRef<HTMLDivElement>(null);
  const loadedFromUrl = useRef(false);
  const headerRow = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [headerGone, setHeaderGone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Load a shared comparison (?p=slug,slug) once, then keep the URL in sync.
  useEffect(() => {
    if (!hydrated || loadedFromUrl.current) return;
    loadedFromUrl.current = true;
    const slugs = (params.get("p") ?? "").split(",").filter(Boolean);
    if (!slugs.length) return;
    const wanted = slugs.map((s) => phones.find((p) => p.slug === s)).filter((p): p is Product => !!p).slice(0, MAX_COMPARE);
    if (wanted.length) {
      clear();
      wanted.forEach((p) => toggle(toCompareItem(p)));
    }
  }, [hydrated, params, phones, clear, toggle]);

  const selected = useMemo(() => items.map((i) => phones.find((p) => p.id === i.id)).filter((p): p is Product => !!p), [items, phones]);

  useEffect(() => {
    if (!hydrated || !loadedFromUrl.current) return;
    const q = selected.length ? `?p=${selected.map((p) => p.slug).join(",")}` : "";
    if (window.location.search !== q) router.replace(`${pathname}${q}`, { scroll: false });
  }, [selected, hydrated, pathname, router]);

  // "Best at" badges.
  const badges = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (selected.length < 2) return out;
    const award = (label: string, score: (p: Product) => number | null, better: "min" | "max") => {
      const scored = selected.map((p) => ({ p, s: score(p) })).filter((x) => x.s != null) as { p: Product; s: number }[];
      if (scored.length < 2) return;
      const best = better === "min" ? Math.min(...scored.map((x) => x.s)) : Math.max(...scored.map((x) => x.s));
      const winners = scored.filter((x) => x.s === best);
      if (winners.length === scored.length) return; // a tie across the board isn't news
      winners.forEach((w) => (out[w.p.id] ??= []).push(label));
    };
    award("Lowest price", price, "min");
    award("Biggest battery", batteryMah, "max");
    award("Best main camera", mainCameraMp, "max");
    award("Largest screen", displayInches, "max");
    return out;
  }, [selected]);

  const groups = useMemo(() => {
    const t = (v: unknown) => (v == null || v === "" ? "—" : String(v));
    const specRow = (label: string, key: string, fmt?: (v: unknown) => string): Row => {
      const vals = selected.map((p) => (fmt ? fmt(p.specs[key]) : t(p.specs[key])));
      return { label, values: vals, keys: vals };
    };
    const condition: Row[] = [
      {
        label: "Condition",
        values: selected.map((p) => {
          const v = baseVariant(p);
          return <ConditionChip key={p.id} label={conditionLabel(p, v)} isNew={p.condition === "new"} grade={v?.grade} />;
        }),
        keys: selected.map((p) => conditionLabel(p)),
      },
      {
        label: "Battery health",
        values: selected.map((p) => {
          const b = baseVariant(p)?.battery_health;
          return p.condition === "uk_used" && b != null ? <BatteryBar key={p.id} pct={b} compact /> : <span key={p.id}>New · 100%</span>;
        }),
        keys: selected.map((p) => (p.condition === "uk_used" ? String(baseVariant(p)?.battery_health) : "new")),
      },
      {
        label: "Warranty",
        values: selected.map((p) => `${baseVariant(p)?.warranty_months ?? 0} months`),
        keys: selected.map((p) => String(baseVariant(p)?.warranty_months ?? 0)),
      },
      {
        label: "Storage",
        values: selected.map((p) => (
          <span key={p.id} className="flex flex-wrap gap-1">
            {storages(p).map((s) => (
              <span key={s} className="num rounded-full bg-surface-2 px-2 py-0.5 text-micro text-muted">
                {s}
              </span>
            ))}
          </span>
        )),
        keys: selected.map((p) => storages(p).join(",")),
      },
    ];
    return [
      { title: "DISPLAY", rows: [specRow("Screen", "display")] },
      { title: "PERFORMANCE", rows: [specRow("Chip", "chip"), specRow("RAM", "ram"), specRow("Software", "os"), specRow("Network", "network")] },
      { title: "CAMERA", rows: [specRow("Cameras", "camera")] },
      { title: "BATTERY", rows: [specRow("Capacity", "battery_mah", (v) => (typeof v === "number" ? `${v.toLocaleString("en-US")} mAh` : "—"))] },
      { title: "CONDITION & WARRANTY", rows: condition },
    ];
  }, [selected]);

  useEffect(() => {
    const el = headerRow.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeaderGone(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [selected.length]);

  const onScroll = () => {
    if (miniHeader.current && scroller.current) miniHeader.current.scrollLeft = scroller.current.scrollLeft;
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Comparison link copied");
    } catch {
      toast("Couldn't copy the link");
    }
  };

  if (!hydrated) return <div className="h-72 animate-pulse rounded-card bg-surface" />;

  const pickerEl = picker && (
    <PhonePicker
      phones={phones}
      exclude={selected.map((p) => p.id)}
      onClose={() => setPicker(false)}
      onPick={(p) => {
        toggle(toCompareItem(p));
        setPicker(false);
      }}
    />
  );

  if (!selected.length) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border px-6 py-12 text-center">
          <GitCompare size={36} strokeWidth={1.25} className="text-muted" />
          <div className="flex flex-col gap-1.5">
            <span className="text-h3 font-semibold">Pick up to three phones</span>
            <span className="max-w-sm text-small text-muted">See screens, cameras, batteries and condition side by side. Differences are highlighted for you.</span>
          </div>
          <button type="button" onClick={() => setPicker(true)} className="btn btn-primary btn-lg">
            <Plus size={18} strokeWidth={1.75} />
            Add a phone
          </button>
        </div>
        {suggestions.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-h3 font-semibold">Popular comparisons</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {suggestions.map((pair) => {
                const ps = pair.map((s) => phones.find((p) => p.slug === s)).filter((p): p is Product => !!p);
                if (ps.length < 2) return null;
                return (
                  <button
                    key={pair.join()}
                    type="button"
                    onClick={() => ps.forEach((p) => toggle(toCompareItem(p)))}
                    className="flex items-center gap-3 rounded-card border border-border p-3 text-left hover:bg-surface"
                  >
                    <span className="flex -space-x-3">
                      {ps.map((p) => (
                        <ProductImage key={p.id} src={p.images[0]} alt="" sizes="56px" className="h-14 w-14 rounded-lg ring-2 ring-bg" />
                      ))}
                    </span>
                    <span className="text-small font-medium">{ps.map((p) => p.name).join(" vs ")}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {pickerEl}
      </div>
    );
  }

  const slots = selected.length < MAX_COMPARE ? selected.length + 1 : selected.length;
  const cols = isNarrow ? `84px repeat(${slots}, minmax(136px, 1fr))` : `minmax(110px,150px) repeat(${slots}, minmax(160px, 1fr))`;
  const differs = (keys: string[]) => keys.length > 1 && new Set(keys).size > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-5">
          <label className="flex cursor-pointer items-center gap-1 text-[15px] font-medium">
            <Switch checked={hl} onChange={setHl} label="Highlight differences" />
            Highlight differences
          </label>
          <label className="flex cursor-pointer items-center gap-1 text-[15px] font-medium">
            <Switch checked={onlyDiff} onChange={setOnlyDiff} label="Only show differences" />
            Only differences
          </label>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={share} className="btn btn-ghost text-small">
            <Link2 size={16} strokeWidth={1.5} />
            Share
          </button>
          <button type="button" onClick={clear} className="btn btn-ghost text-small text-muted">
            Clear all
          </button>
        </div>
      </div>

      {/* Mobile: compact names pinned under the site header, scrolled in sync with the table */}
      <div className={cn("sticky top-14 z-[6] -mx-4 border-b border-border bg-bg transition-opacity duration-150 md:hidden", headerGone ? "opacity-100" : "pointer-events-none h-0 overflow-hidden border-0 opacity-0")} aria-hidden>
        <div ref={miniHeader} className="overflow-hidden px-4" onTransitionEnd={onScroll}>
          <div className="grid min-w-max" style={{ gridTemplateColumns: cols }}>
            <div className="sticky left-0 bg-bg" />
            {selected.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                <ProductImage src={p.images[0]} alt="" sizes="32px" className="h-8 w-8 shrink-0 rounded-md" />
                <span className="truncate text-[13px] font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={scroller} onScroll={onScroll} className="-mx-4 overflow-x-auto md:mx-0 md:overflow-visible">
        <div className="min-w-max px-4 md:min-w-0 md:px-0" role="table" aria-label="Phone comparison">
          <div ref={headerRow} role="row" className="z-[5] grid border-b border-border bg-bg md:sticky md:top-14" style={{ gridTemplateColumns: cols }}>
            <div role="columnheader" className="sticky left-0 z-[1] bg-bg" />
            {selected.map((p) => {
              const v = baseVariant(p);
              const inStock = !!v && v.in_stock && v.stock_qty > 0;
              return (
                <div role="columnheader" key={p.id} className="flex min-w-0 flex-col gap-2 p-3 text-left font-normal">
                  <div className="relative max-w-[120px] md:max-w-[170px]">
                    <Link href={`/product/${p.slug}`} aria-label={p.name}>
                      <ProductImage src={p.images[0]} alt={p.name} sizes="170px" className="aspect-square rounded-btn" />
                    </Link>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg shadow-sm">
                        <X size={14} strokeWidth={1.75} />
                      </span>
                    </button>
                  </div>
                  <Link href={`/product/${p.slug}`} className="text-[15px] font-semibold text-text">
                    {p.name}
                  </Link>
                  <div className="num flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[17px] font-medium">{v ? formatNaira(v.price) : "—"}</span>
                    {v?.old_price != null && v.old_price > v.price && <DealBadge saving={v.old_price - v.price} />}
                  </div>
                  {badges[p.id]?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {badges[p.id].map((b) => (
                        <span key={b} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-micro font-medium text-accent">
                          <Trophy size={12} strokeWidth={1.75} />
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {v && (
                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => {
                        add(toCartItem(p, v));
                        toast("Added to cart");
                      }}
                      className="btn btn-primary mt-auto h-10 self-start px-3.5 text-small"
                    >
                      {inStock ? "Add to cart" : "Sold out"}
                    </button>
                  )}
                </div>
              );
            })}
            {selected.length < MAX_COMPARE && (
              <div role="columnheader" className="p-3">
                <button
                  type="button"
                  onClick={() => setPicker(true)}
                  className="flex aspect-square w-full max-w-[120px] flex-col md:max-w-[170px] items-center justify-center gap-2 rounded-btn border-2 border-dashed border-border text-small font-medium text-muted hover:border-accent hover:text-accent"
                >
                  <Plus size={24} strokeWidth={1.5} />
                  Add a phone
                </button>
              </div>
            )}
          </div>

          {groups.map((g) => {
            const rows = g.rows.filter((r) => !onlyDiff || differs(r.keys));
            if (!rows.length) return null;
            return (
              <div key={g.title} role="rowgroup">
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  <div className="sticky left-0 bg-bg pb-2 pr-3 pt-6 text-[12px] font-semibold tracking-[0.04em] text-muted">{g.title}</div>
                </div>
                {rows.map((r) => {
                  const on = hl && differs(r.keys);
                  return (
                    <div role="row" key={r.label} className={cn("grid border-b border-border transition-colors duration-150", on && "bg-accent-soft")} style={{ gridTemplateColumns: cols }}>
                      <div role="rowheader" className={cn("sticky left-0 flex items-start gap-1.5 py-3.5 pr-3 text-small text-muted transition-colors duration-150", on ? "bg-accent-soft" : "bg-bg")}>
                        {r.label}
                      </div>
                      {r.values.map((val, i) => (
                        <div role="cell" key={i} className="px-3 py-3.5 text-small leading-[1.45]">
                          {val}
                        </div>
                      ))}
                      {selected.length < MAX_COMPARE && <div role="cell" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {onlyDiff && groups.every((g) => g.rows.every((r) => !differs(r.keys))) && (
            <p className="flex items-center gap-2 py-6 text-small text-muted">
              <Check size={16} strokeWidth={1.75} className="text-success" />
              These phones match on every spec we list.
            </p>
          )}
        </div>
      </div>
      {pickerEl}
    </div>
  );
}
