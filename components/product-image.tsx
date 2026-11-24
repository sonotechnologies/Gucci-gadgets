"use client";
import { Headphones, Smartphone, Watch } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

/**
 * Product photo on a soft `surface` tile. Falls back to a labelled striped
 * placeholder when a product has no photo yet, or the photo fails to load.
 */
export function ProductImage({
  src,
  alt,
  category = "phone",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className,
  imgClassName,
}: {
  src: string | null | undefined;
  alt: string;
  category?: Category;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const show = src && failed !== src;
  // Callers that stretch the tile over a card pass `absolute inset-0`; adding
  // `relative` too would override it (Tailwind orders .relative after .absolute)
  // and collapse the tile to zero height.
  const positioned = /\b(absolute|fixed)\b/.test(className ?? "");
  return (
    <div className={cn(!positioned && "relative", "overflow-hidden bg-surface", className)}>
      {show ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailed(src)} className={cn(!/object-contain/.test(imgClassName ?? "") && "object-cover", imgClassName)} />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted"
          style={{ background: "repeating-linear-gradient(135deg, var(--surface) 0 8px, var(--bg) 8px 16px)" }}
        >
          {category === "accessory" ? <Headphones size={28} strokeWidth={1.5} /> : category === "gadget" ? <Watch size={28} strokeWidth={1.5} /> : <Smartphone size={28} strokeWidth={1.5} />}
          <span className="rounded-md bg-bg px-2 py-0.5 font-mono text-micro">product shot</span>
        </div>
      )}
    </div>
  );
}
