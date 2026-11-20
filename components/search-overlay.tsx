"use client";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatNaira } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { ProductImage } from "./product-image";
import { useSettings } from "./providers";

export interface SearchEntry {
  slug: string;
  name: string;
  brand: string;
  chip: string;
  storages: string[];
  price: number;
  image: string | null;
  category: "phone" | "accessory" | "gadget";
  haystack: string;
}

const POPULAR = ["iPhone 16 Pro Max", "Galaxy S25 Ultra", "UK-used", "Pixel", "AirPods", "Power bank"];

export function SearchOverlay({ entries, onClose }: { entries: SearchEntry[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const settings = useSettings();

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const results = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return entries.slice(0, 4);
    return entries.filter((e) => terms.every((t) => e.haystack.includes(t))).slice(0, 12);
  }, [q, entries]);

  return (
    <>
      <div className="fixed inset-0 z-[58] animate-fade bg-scrim" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-x-0 top-0 z-[59] flex max-h-[85vh] animate-rise flex-col border-b border-border bg-bg">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) window.location.href = `/product/${results[0].slug}`;
          }}
          className="mx-auto flex w-full max-w-[760px] items-center gap-2 px-4 py-4 md:px-8"
        >
          <label className="relative flex-1">
            <span className="sr-only">Search phones</span>
            <Search size={20} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-3.5 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phones, brands, storage"
              className="input h-12 pl-11"
              type="search"
            />
          </label>
          <button type="button" onClick={onClose} className="btn btn-ghost h-12 px-3">
            Cancel
          </button>
        </form>
        <div className="mx-auto flex w-full max-w-[760px] flex-col overflow-y-auto px-4 pb-5 md:px-8">
          {!q.trim() && (
            <div className="flex flex-col gap-2.5 pb-2 pt-1">
              <span className="text-[13px] text-muted">Popular</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => setQ(p)} className="h-10 rounded-full border border-border px-4 text-small font-medium hover:bg-surface">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.map((r) => (
            <Link key={r.slug} href={`/product/${r.slug}`} onClick={onClose} className="flex items-center gap-3 border-b border-border py-2.5 text-text hover:no-underline">
              <ProductImage src={r.image} alt="" category={r.category} sizes="52px" className="h-[52px] w-[52px] shrink-0 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-medium">{r.name}</span>
                <span className="truncate text-[13px] text-muted">
                  {r.chip}
                  {r.storages.length > 0 && ` · ${r.storages.join(" · ")}`}
                </span>
              </span>
              <span className="num text-small font-medium">{formatNaira(r.price)}</span>
            </Link>
          ))}
          {q.trim() && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <SearchX size={28} strokeWidth={1.5} className="text-muted" />
              <span className="text-[15px] font-medium">No phones match &ldquo;{q}&rdquo;</span>
              <span className="text-small text-muted">
                Ask us on{" "}
                <a href={waLink(settings.whatsapp_number, `Hello Gucci Gadgets 👋\nDo you have ${q}?`)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                . We can usually source it within 48 hours.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
