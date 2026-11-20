"use client";
import { GitCompare, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { baseVariant, conditionLabel, SPEC_GROUPS, specValue } from "@/lib/catalog";
import { toCartItem } from "@/lib/cart-item";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useCart, useCompare, useHydrated, useToast } from "@/lib/stores";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { EmptyState, Switch } from "./ui";

export function CompareView({ phones }: { phones: Product[] }) {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);
  const hydrated = useHydrated();
  const [hl, setHl] = useState(true);

  const selected = useMemo(() => items.map((i) => phones.find((p) => p.id === i.id)).filter((p): p is Product => !!p), [items, phones]);

  const groups = useMemo(() => {
    const rows = SPEC_GROUPS.map((g) => ({
      title: g.title,
      rows: g.rows.map((r) => ({ label: r.label, values: selected.map((p) => specValue(r.key, p.specs[r.key])) })),
    }));
    rows.push({
      title: "CONDITION",
      rows: [
        { label: "Condition", values: selected.map((p) => conditionLabel(p)) },
        { label: "Battery health", values: selected.map((p) => (p.condition === "uk_used" ? `${baseVariant(p)?.battery_health ?? "—"}%` : "New")) },
        { label: "Warranty", values: selected.map((p) => `${baseVariant(p)?.warranty_months ?? 0} months`) },
        { label: "Storage", values: selected.map((p) => [...new Set(p.variants.map((v) => v.storage))].filter(Boolean).join(" · ")) },
      ],
    });
    return rows;
  }, [selected]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-card bg-surface" />;

  if (!selected.length) {
    return (
      <EmptyState
        icon={<GitCompare size={32} strokeWidth={1.25} />}
        title="No phones selected"
        body="Tap the compare icon on up to three phones to see them side by side."
        action={
          <Link href="/shop/phones" className="btn btn-primary hover:no-underline">
            Browse phones
          </Link>
        }
      />
    );
  }

  const cols = `minmax(110px,160px) repeat(${selected.length}, minmax(150px, 1fr))`;
  const differs = (vals: string[]) => vals.length > 1 && new Set(vals).size > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-muted">
          {selected.length} of 3 phones{selected.length < 3 && " · add more from the shop"}
        </p>
        <label className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium">
          <Switch checked={hl} onChange={setHl} label="Highlight differences" />
          Highlight differences
        </label>
      </div>
      {/* Mobile: table scrolls sideways, label column stays fixed. Desktop: header row pinned while scrolling. */}
      <div className="-mx-4 overflow-x-auto md:mx-0 md:overflow-visible">
        <div className="min-w-max px-4 md:min-w-0 md:px-0" role="table" aria-label="Phone comparison">
          <div role="row" className="z-[5] grid border-b border-border bg-bg md:sticky md:top-14" style={{ gridTemplateColumns: cols }}>
            <div role="columnheader" className="sticky left-0 z-[1] bg-bg" />
            {selected.map((p) => {
              const v = baseVariant(p);
              return (
                <div role="columnheader" key={p.id} className="flex min-w-0 flex-col gap-2 p-3">
                  <div className="relative max-w-[160px]">
                    <ProductImage src={p.images[0]} alt={p.name} sizes="160px" className="aspect-square rounded-btn" />
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg">
                        <X size={14} strokeWidth={1.75} />
                      </span>
                    </button>
                  </div>
                  <Link href={`/product/${p.slug}`} className="text-[15px] font-medium text-text">
                    {p.name}
                  </Link>
                  <span className="num text-[15px] font-medium">{v ? formatNaira(v.price) : "—"}</span>
                  {v && (
                    <button
                      type="button"
                      disabled={!v.in_stock || v.stock_qty <= 0}
                      onClick={() => {
                        add(toCartItem(p, v));
                        toast("Added to cart");
                      }}
                      className="btn btn-primary h-10 self-start px-3.5 text-small"
                    >
                      Add to cart
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {groups.map((g) => (
            <div key={g.title} role="rowgroup">
              <div className="grid" style={{ gridTemplateColumns: cols }}>
                <div className="sticky left-0 bg-bg pb-2 pr-3 pt-6 text-[13px] font-semibold tracking-[0.02em] text-muted">{g.title}</div>
              </div>
              {g.rows.map((r) => {
                const on = hl && differs(r.values);
                return (
                  <div role="row" key={r.label} className={cn("grid border-b border-border transition-colors duration-150", on && "bg-accent-soft")} style={{ gridTemplateColumns: cols }}>
                    <div role="rowheader" className={cn("sticky left-0 py-3.5 pr-3 text-small text-muted transition-colors duration-150", on ? "bg-accent-soft" : "bg-bg")}>
                      {r.label}
                    </div>
                    {r.values.map((val, i) => (
                      <div role="cell" key={i} className="px-3 py-3.5 text-small leading-[1.45]">
                        {val}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
