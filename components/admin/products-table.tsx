"use client";
import { ChevronDown, PackageOpen, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setProductActive, setProductInStock, updateVariantQuick } from "@/lib/admin/actions";
import { baseVariant, conditionLabel, isDealActive, isInStock } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import type { Product, Variant } from "@/lib/types";
import { ProductImage } from "../product-image";
import { EmptyState, Segmented, Switch } from "../ui";
import { useReport } from "./admin-ui";

type Filter = "all" | "out" | "deals";

/** Inline price input: saves on blur or Enter. */
function PriceCell({ v, onSaved }: { v: Variant; onSaved: (price: number) => void }) {
  const [val, setVal] = useState(String(v.price));
  const [pending, start] = useTransition();
  const report = useReport();
  const save = () => {
    const n = Number(val.replace(/[^\d]/g, ""));
    if (!val || n === v.price) return setVal(String(v.price));
    start(async () => {
      const ok = report(await updateVariantQuick(v.id, { price: n }), "Price updated");
      if (ok) onSaved(n);
      else setVal(String(v.price));
    });
  };
  return (
    <label className="relative block">
      <span className="sr-only">Price for {[v.storage, v.colour].filter(Boolean).join(" ")}</span>
      <span className="pointer-events-none absolute left-2.5 top-2.5 text-small text-muted">₦</span>
      <input
        value={val}
        inputMode="numeric"
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        className={cn("num h-10 w-full rounded-lg border border-border bg-surface-2 pl-7 pr-2 text-[15px]", pending && "opacity-50")}
      />
    </label>
  );
}

export function ProductsTable({ products: initial, initialFilter }: { products: Product[]; initialFilter: Filter }) {
  const [products, setProducts] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [open, setOpen] = useState<string | null>(null);
  const [, start] = useTransition();
  const report = useReport();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => {
      if (t && !`${p.name} ${p.brand} ${conditionLabel(p)}`.toLowerCase().includes(t)) return false;
      if (filter === "out" && isInStock(p)) return false;
      if (filter === "deals" && !isDealActive(p)) return false;
      return true;
    });
  }, [products, q, filter]);

  const patchProduct = (id: string, fn: (p: Product) => Product) => setProducts((ps) => ps.map((p) => (p.id === id ? fn(p) : p)));

  const toggleStock = (p: Product, on: boolean) => {
    const before = p;
    patchProduct(p.id, (x) => ({ ...x, variants: x.variants.map((v) => ({ ...v, in_stock: on })) }));
    start(async () => {
      if (!report(await setProductInStock(p.id, on), on ? "Marked in stock" : "Marked out of stock")) patchProduct(p.id, () => before);
    });
  };
  const toggleActive = (p: Product, on: boolean) => {
    patchProduct(p.id, (x) => ({ ...x, is_active: on }));
    start(async () => {
      if (!report(await setProductActive(p.id, on), on ? "Product is live" : "Product hidden")) patchProduct(p.id, (x) => ({ ...x, is_active: !on }));
    });
  };
  const toggleVariant = (p: Product, v: Variant, on: boolean) => {
    patchProduct(p.id, (x) => ({ ...x, variants: x.variants.map((y) => (y.id === v.id ? { ...y, in_stock: on } : y)) }));
    start(async () => {
      if (!report(await updateVariantQuick(v.id, { in_stock: on }), "Stock updated"))
        patchProduct(p.id, (x) => ({ ...x, variants: x.variants.map((y) => (y.id === v.id ? { ...y, in_stock: !on } : y)) }));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-[360px]">
          <span className="sr-only">Search products</span>
          <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="input bg-bg pl-10" type="search" />
        </label>
        <div className="w-full sm:w-[320px]">
          <Segmented
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "out", label: "Out of stock" },
              { value: "deals", label: "Deals" },
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<PackageOpen size={32} strokeWidth={1.25} />} title="No products here" body="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-bg">
          <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_80px_80px_44px] gap-3 border-b border-border px-[18px] py-3 text-[13px] font-semibold text-muted md:grid">
            <span>Product</span>
            <span>Condition</span>
            <span>From</span>
            <span>In stock</span>
            <span>Live</span>
            <span />
          </div>
          {list.map((p) => {
            const bv = baseVariant(p);
            const stockOn = p.variants.some((v) => v.in_stock);
            const qty = p.variants.reduce((n, v) => n + (v.in_stock ? v.stock_qty : 0), 0);
            const expanded = open === p.id;
            return (
              <div key={p.id} className={cn("border-b border-border last:border-0", !p.is_active && "opacity-60")}>
                <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] items-center gap-2 px-[18px] py-3 md:grid-cols-[minmax(0,2.4fr)_1fr_1fr_80px_80px_44px] md:gap-3">
                  <button type="button" onClick={() => setOpen(expanded ? null : p.id)} aria-expanded={expanded} className="flex min-w-0 items-center gap-3 text-left">
                    <ProductImage src={p.images[0]} alt="" category={p.category} sizes="44px" className="h-11 w-11 shrink-0 rounded-lg" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-[15px] font-medium">
                        <span className="truncate">{p.name}</span>
                        <ChevronDown size={16} strokeWidth={1.5} className={cn("shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
                      </span>
                      <span className="text-[13px] text-muted md:hidden">
                        {conditionLabel(p)} · <span className="num">{bv ? formatNaira(bv.price) : "—"}</span> · {qty} left
                      </span>
                      <span className="hidden text-[13px] text-muted md:inline">
                        {p.variants.length} variant{p.variants.length === 1 ? "" : "s"} · {qty} in stock
                      </span>
                    </span>
                  </button>
                  <span className="hidden text-small md:inline">{conditionLabel(p)}</span>
                  <span className="num hidden text-small md:inline">{bv ? formatNaira(bv.price) : "—"}</span>
                  <Switch checked={stockOn} onChange={(on) => toggleStock(p, on)} label={`${p.name} in stock`} />
                  <Switch checked={p.is_active} onChange={(on) => toggleActive(p, on)} label={`${p.name} visible on site`} />
                  <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="icon-btn">
                    <Pencil size={18} strokeWidth={1.5} />
                  </Link>
                </div>
                {expanded && (
                  <div className="flex flex-col gap-2 bg-surface px-[18px] py-3">
                    <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_60px] gap-3 text-micro font-semibold text-muted sm:grid">
                      <span>Variant</span>
                      <span>Price</span>
                      <span>Qty</span>
                      <span>In stock</span>
                    </div>
                    {p.variants.map((v) => (
                      <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_70px_60px]">
                        <span className="truncate text-small">{[v.storage, v.colour].filter(Boolean).join(" · ") || "Default"}</span>
                        <PriceCell v={v} onSaved={(price) => patchProduct(p.id, (x) => ({ ...x, variants: x.variants.map((y) => (y.id === v.id ? { ...y, price } : y)) }))} />
                        <span className="num hidden text-small text-muted sm:inline">{v.stock_qty}</span>
                        <Switch checked={v.in_stock} onChange={(on) => toggleVariant(p, v, on)} label="Variant in stock" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-micro text-muted md:hidden">Toggles: in stock · visible on site. Tap a product to edit variant prices.</p>
    </div>
  );
}
