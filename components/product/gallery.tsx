"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { ProductImage } from "../product-image";

/** Main image + thumbnails on desktop; swipeable scroll-snap strip with dots on mobile. */
export function Gallery({ images, name, category }: { images: string[]; name: string; category: Category }) {
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const list = images.length ? images : [""];

  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile swipe strip */}
      <div className="relative md:hidden">
        <div ref={strip} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-card" aria-label={`${name} photos`}>
          {list.map((src, i) => (
            <ProductImage key={i} src={src || null} alt={`${name}, photo ${i + 1}`} category={category} priority={i === 0} sizes="100vw" className="aspect-square w-full shrink-0 snap-center" />
          ))}
        </div>
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {list.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all duration-200", i === active ? "w-4 bg-text" : "w-1.5 bg-muted")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop main + thumbs */}
      <div className="hidden flex-col gap-3 md:flex">
        <ProductImage src={list[active] || null} alt={name} category={category} priority sizes="(min-width: 1280px) 720px, 60vw" className="aspect-square rounded-card" />
        {list.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {list.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn("overflow-hidden rounded-btn border-2 transition-colors", i === active ? "border-accent" : "border-transparent")}
              >
                <ProductImage src={src || null} alt="" category={category} sizes="160px" className="aspect-square" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
