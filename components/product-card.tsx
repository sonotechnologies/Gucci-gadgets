"use client";
import { GitCompare, Plus, Check } from "lucide-react";
import Link from "next/link";
import { baseVariant, conditionLabel, hasPriceDrop, isPhone, storages } from "@/lib/catalog";
import { toCartItem, toCompareItem } from "@/lib/cart-item";
import { cn } from "@/lib/cn";
import { formatNaira, storageShort } from "@/lib/format";
import { useCart, useCompare, useHydrated, useToast } from "@/lib/stores";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { BatteryBar, ConditionChip, DealBadge } from "./ui";

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const v = baseVariant(p);
  const add = useCart((s) => s.add);
  const toggleCompare = useCompare((s) => s.toggle);
  const compared = useCompare((s) => s.items.some((i) => i.id === p.id));
  const hydrated = useHydrated();
  const toast = useToast((s) => s.show);
  if (!v) return null;

  const inStock = p.variants.some((x) => x.in_stock && x.stock_qty > 0);
  const drop = hasPriceDrop(v);
  // Coral saving badge whenever the price has dropped (deal or price drop).
  const showDeal = drop;
  const used = p.condition === "uk_used";
  const phone = isPhone(p);
  const sizes = storages(p);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    add(toCartItem(p, v));
    toast("Added to cart");
  };
  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = toggleCompare(toCompareItem(p));
    if (r === "full") toast("You can compare up to 3 phones");
  };

  return (
    <Link href={`/product/${p.slug}`} className="group flex min-w-0 flex-col gap-2.5 text-text no-underline hover:no-underline">
      <div className="relative aspect-square overflow-hidden rounded-card transition-transform duration-200 ease-out md:group-hover:-translate-y-0.5">
        <ProductImage
          src={p.images[0]}
          alt={p.name}
          category={p.category}
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className="absolute inset-0"
          imgClassName="transition-transform duration-[250ms] ease-out md:group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          <ConditionChip label={conditionLabel(p, v)} isNew={!used} grade={v.grade} />
          {showDeal && v.old_price != null && <DealBadge saving={v.old_price - v.price} />}
          {!inStock && <span className="inline-flex h-6 items-center rounded-full bg-bg px-2.5 text-micro font-medium text-muted">Sold out</span>}
        </div>
        {phone && (
          <button
            type="button"
            onClick={onCompare}
            aria-label={compared ? `Remove ${p.name} from compare` : `Compare ${p.name}`}
            aria-pressed={hydrated && compared}
            className="absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center"
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150",
                hydrated && compared ? "bg-accent text-on-accent" : "bg-bg text-text",
              )}
            >
              {hydrated && compared ? <Check size={16} strokeWidth={2} /> : <GitCompare size={16} strokeWidth={1.5} />}
            </span>
          </button>
        )}
        {inStock && (
          <>
            {/* Mobile: always-visible + button */}
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${p.name} to cart`}
              className="absolute bottom-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-bg text-text shadow-[0_1px_3px_rgba(0,0,0,.12)] md:hidden"
            >
              <Plus size={20} strokeWidth={1.75} />
            </button>
            {/* Desktop: slide-up Add to cart on hover */}
            <button
              type="button"
              onClick={onAdd}
              className="btn btn-primary absolute inset-x-2.5 bottom-2.5 hidden translate-y-3 text-small opacity-0 transition-[transform,opacity] duration-200 ease-out focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex"
            >
              Add to cart
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <div className="text-[15px] font-medium leading-[1.3]">{p.name}</div>
        {(sizes.length > 0 || (used && v.battery_health != null)) && (
          <div className="flex flex-wrap items-center gap-1">
            {sizes.map((s) => (
              <span key={s} className="num h-[22px] rounded-full bg-surface-2 px-2 text-micro leading-[22px] text-muted">
                {storageShort(s)}
              </span>
            ))}
            {used && v.battery_health != null && (
              <span className="ml-1">
                <BatteryBar pct={v.battery_health} compact />
              </span>
            )}
          </div>
        )}
        <div className="num flex flex-wrap items-baseline gap-x-2">
          <span className="text-body font-medium">{formatNaira(v.price)}</span>
          {drop && <span className="text-[13px] text-muted line-through">{formatNaira(v.old_price!)}</span>}
        </div>
      </div>
    </Link>
  );
}
