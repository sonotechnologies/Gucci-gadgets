import { Headphones, Smartphone, Watch } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

/**
 * Product photo on a soft `surface` tile. Falls back to a labelled striped
 * placeholder when a product has no photo yet (easy to spot and replace).
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
  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imgClassName)} />
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
