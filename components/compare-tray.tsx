"use client";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MAX_COMPARE, useCompare, useHydrated } from "@/lib/stores";
import { ProductImage } from "./product-image";

/** Sticky tray that rises from the bottom when 1–3 phones are selected for compare. */
export function CompareTray() {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const show = hydrated && items.length > 0 && pathname !== "/compare";

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed bottom-3 left-1/2 z-[35] flex w-[min(560px,calc(100%-24px))] items-center gap-2.5 rounded-card border border-border bg-bg py-2.5 pl-3.5 pr-2.5 shadow-float transition-[transform,opacity] duration-[250ms] ease-out md:bottom-5",
        show ? "-translate-x-1/2 translate-y-0 opacity-100" : "pointer-events-none -translate-x-1/2 translate-y-6 opacity-0",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-2">
        {items.map((t) => (
          <div key={t.id} className="relative h-12 w-12 shrink-0">
            <ProductImage src={t.image} alt={t.name} sizes="48px" className="h-12 w-12 rounded-lg" />
            <button type="button" onClick={() => remove(t.id)} aria-label={`Remove ${t.name} from compare`} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-text text-bg">
                <X size={11} strokeWidth={2} />
              </span>
            </button>
          </div>
        ))}
        <span className="self-center whitespace-nowrap text-[13px] text-muted">
          {items.length} of {MAX_COMPARE}
        </span>
      </div>
      <Link href="/compare" className="btn btn-primary shrink-0 hover:no-underline">
        Compare
      </Link>
    </div>
  );
}
