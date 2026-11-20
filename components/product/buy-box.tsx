"use client";
import { Check, GitCompare, Info, MessageCircle, Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { colours, conditionLabel, findVariant, GRADE_COPY, isPhone, storages, swatchHex, variantInStock } from "@/lib/catalog";
import { toCartItem, toCompareItem, toOrderLine } from "@/lib/cart-item";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useCart, useCompare, useHydrated, useToast } from "@/lib/stores";
import type { Product } from "@/lib/types";
import { singleProductMessage, waLink } from "@/lib/whatsapp";
import { useSettings } from "../providers";
import { BatteryBar, CheckLine, ConditionChip, Countdown, GradeBadge, PriceBlock, Segmented } from "../ui";

export function BuyBox({ product: p }: { product: Product }) {
  const st = storages(p);
  const cols = colours(p);
  const [storage, setStorage] = useState<string | null>(st[0] ?? null);
  const [colour, setColour] = useState<string | null>(cols[0] ?? null);
  const [qty, setQty] = useState(1);
  const [gradeTip, setGradeTip] = useState(false);
  const v = findVariant(p, storage, colour);
  const settings = useSettings();
  const add = useCart((s) => s.add);
  const toggleCompare = useCompare((s) => s.toggle);
  const compared = useCompare((s) => s.items.some((i) => i.id === p.id));
  const hydrated = useHydrated();
  const toast = useToast((s) => s.show);
  if (!v) return null;

  const inStock = variantInStock(v);
  const used = p.condition === "uk_used";
  const low = inStock && v.stock_qty <= 2;
  const notes = v.notes ? v.notes.split(/(?<=\.)\s+/).filter(Boolean) : [];
  const waHref = waLink(settings.whatsapp_number, singleProductMessage(toOrderLine({ ...toCartItem(p, v), qty })));
  const dealLive = p.tags.includes("deal") && p.deal_ends_at && new Date(p.deal_ends_at).getTime() > Date.now();

  const onAdd = () => {
    add(toCartItem(p, v), qty);
    toast("Added to cart");
  };
  const onCompare = () => {
    const r = toggleCompare(toCompareItem(p));
    toast(r === "full" ? "You can compare up to 3 phones" : r === "added" ? "Added to compare" : "Removed from compare");
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:sticky md:top-24">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <ConditionChip label={conditionLabel(p, v)} isNew={!used} grade={v.grade} size="md" />
            {dealLive && <Countdown endsAt={p.deal_ends_at!} className="h-[26px]" />}
          </div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] md:text-h1">{p.name}</h1>
          <PriceBlock price={v.price} old={v.old_price} size="lg" />
        </div>

        {st.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-small text-muted">Storage</span>
            <Segmented label="Storage" mono value={storage ?? ""} onChange={setStorage} options={st.map((s) => ({ value: s, label: s }))} />
          </div>
        )}

        {cols.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-small text-muted">
              Colour · <span className="text-text">{colour}</span>
            </span>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Colour">
              {cols.map((c) => {
                const cv = findVariant(p, storage, c);
                const out = !variantInStock(cv);
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={c === colour}
                    aria-label={`${c}${out ? " (sold out)" : ""}`}
                    title={c}
                    onClick={() => setColour(c)}
                    className={cn("relative h-11 w-11 rounded-full border-2 p-1", c === colour ? "border-accent" : "border-transparent", out && "opacity-40")}
                  >
                    <span className="block h-full w-full rounded-full border border-border" style={{ background: swatchHex(c) }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-small">
          <span className={cn("h-2 w-2 rounded-full", !inStock ? "bg-deal" : low ? "bg-warning" : "bg-success")} />
          {!inStock ? "Sold out" : low ? `Only ${v.stock_qty} left` : "In stock"}
          <span className="text-muted">· Delivery in Lagos within 24 hours</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-small text-muted">Quantity</span>
          <div className="flex items-center rounded-btn border border-border">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center">
              <Minus size={16} strokeWidth={1.75} />
            </button>
            <span className="num min-w-8 text-center" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(Math.max(1, v.stock_qty), q + 1))}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center"
            >
              <Plus size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-2.5 md:grid">
          <button type="button" onClick={onAdd} disabled={!inStock} className="btn btn-primary h-[52px] text-body">
            Add to cart
          </button>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp h-[52px] text-body hover:no-underline">
            <MessageCircle size={18} strokeWidth={1.5} />
            Order on WhatsApp
          </a>
        </div>
        {isPhone(p) && (
          <button type="button" onClick={onCompare} aria-pressed={hydrated && compared} className="btn btn-secondary self-start">
            {hydrated && compared ? <Check size={16} strokeWidth={1.75} /> : <GitCompare size={16} strokeWidth={1.5} />}
            {hydrated && compared ? "Added to compare" : "Add to compare"}
          </button>
        )}

        {/* Condition card */}
        <div className="flex flex-col gap-4 rounded-card border border-border p-5">
          {used && v.grade && (
            <div className="relative flex items-start gap-3">
              <GradeBadge grade={v.grade} />
              <span className="flex-1 text-small leading-normal text-muted">{GRADE_COPY[v.grade]}</span>
              <button
                type="button"
                aria-label={`What Grade ${v.grade} means`}
                aria-expanded={gradeTip}
                onClick={() => setGradeTip((t) => !t)}
                onBlur={() => setGradeTip(false)}
                className="icon-btn -m-2.5 h-10 w-10 text-muted"
              >
                <Info size={18} strokeWidth={1.5} />
              </button>
              {gradeTip && (
                <div role="tooltip" className="absolute right-0 top-10 z-10 w-72 animate-fade rounded-card border border-border bg-bg p-4 text-small shadow-float">
                  <p className="mb-2 font-semibold">What our grades mean</p>
                  {(Object.keys(GRADE_COPY) as (keyof typeof GRADE_COPY)[]).map((g) => (
                    <p key={g} className="mb-1.5 text-muted">
                      <span className="font-medium text-text">Grade {g}:</span> {GRADE_COPY[g]}
                    </p>
                  ))}
                  <p className="text-muted">Every phone is tested: screen, Face ID or fingerprint, cameras, speakers, mics, charging and network.</p>
                </div>
              )}
            </div>
          )}
          {used && v.battery_health != null && <BatteryBar pct={v.battery_health} />}
          <div className="flex justify-between pt-1 text-small">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} strokeWidth={1.5} className="text-accent" />
              Warranty
            </span>
            <span className="font-medium">{v.warranty_months ? `${v.warranty_months} months` : "Store warranty"}</span>
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3.5">
            {(used
              ? notes.length
                ? notes
                : ["Every function tested before sale"]
              : ["Sealed in box with original accessories", "Official unit, not refurbished", "Free setup and data transfer in store"]
            ).map((n) => (
              <CheckLine key={n}>{n}</CheckLine>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-bg px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-micro text-muted">{[storage, colour].filter(Boolean).join(" · ") || p.name}</span>
          <span className="num text-[18px] font-medium">{formatNaira(v.price * qty)}</span>
        </div>
        <button type="button" onClick={onAdd} disabled={!inStock} className="btn btn-primary btn-lg px-5 text-[15px]">
          {inStock ? "Add to cart" : "Sold out"}
        </button>
        <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Order on WhatsApp" className="btn btn-whatsapp h-12 w-12 px-0 hover:no-underline">
          <MessageCircle size={20} strokeWidth={1.5} />
        </a>
      </div>
    </>
  );
}
