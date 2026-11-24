import { ArrowRight, BadgeCheck, Check, Clock, MapPin, MessageCircle, Phone, Repeat, ShieldCheck, Star, Truck } from "lucide-react";
import Link from "next/link";
import { MiniEstimator } from "@/components/home/mini-estimator";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Countdown, GradeBadge } from "@/components/ui";
import { baseVariant, batteryTone, isDealActive, isNewArrival, isPhone } from "@/lib/catalog";
import { getProducts, getReviews, getSettings, getSwapValues } from "@/lib/data";
import { formatNaira } from "@/lib/format";
import { BRANDS } from "@/lib/types";
import { displayPhone, waLink } from "@/lib/whatsapp";

export const revalidate = 60;

const TONE_BG = { success: "bg-success", warning: "bg-warning", deal: "bg-deal" } as const;

const TRUST = [
  { icon: BadgeCheck, label: "Tested & graded" },
  { icon: ShieldCheck, label: "Warranty on every phone" },
  { icon: Truck, label: "Nationwide delivery" },
  { icon: Repeat, label: "Swap & repairs" },
];

export default async function HomePage() {
  const [products, reviews, settings, swapValues] = await Promise.all([getProducts(), getReviews(), getSettings(), getSwapValues()]);
  const now = Date.now();
  const deals = products.filter((p) => isDealActive(p, now));
  const dealEnd = deals
    .map((p) => p.deal_ends_at)
    .filter((d): d is string => !!d && new Date(d).getTime() > now)
    .sort()[0];
  const landed = products
    .filter((p) => isNewArrival(p, now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  // Featured phone for the trust-first hero: the best-graded UK-used flagship in stock.
  const featured =
    products.find((p) => p.condition === "uk_used" && p.tags.includes("best_seller")) ??
    products.find((p) => p.condition === "uk_used" && isPhone(p)) ??
    products[0];
  const fv = featured ? baseVariant(featured) : undefined;

  const catTiles = [
    { href: "/shop/phones", label: "New phones", img: products.find((p) => p.condition === "new" && isPhone(p))?.images[0] ?? null },
    { href: "/shop/uk-used", label: "UK-used", img: products.find((p) => p.condition === "uk_used")?.images[0] ?? null },
    { href: "/shop/accessories", label: "Accessories", img: products.find((p) => p.category === "accessory")?.images[0] ?? null },
    { href: "/shop/gadgets", label: "Gadgets", img: products.find((p) => p.category === "gadget")?.images[0] ?? null },
  ];

  return (
    <div className="flex flex-col gap-12 pb-12 md:gap-16 md:pb-16">
      {/* Hero 1f — trust-first: condition report card on the photo */}
      <section className="container-site pt-4 md:pt-8">
        <div className="grid overflow-hidden rounded-card bg-surface md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-6 py-8 md:p-12">
            <span className="font-mono text-micro tracking-[0.04em] text-muted">NEW &amp; UK-USED PHONES · LAGOS</span>
            <h1 className="h-display text-balance">Original phones. Honest grades. Lagos prices.</h1>
            <p className="max-w-[440px] text-[17px] leading-[1.55] text-muted">
              Every UK-used phone comes with a written condition report: grade, battery health and what we tested.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary btn-lg hover:no-underline">
                Shop phones
              </Link>
              <Link href="/swap" className="btn btn-secondary btn-lg bg-bg hover:no-underline">
                Swap your phone
              </Link>
            </div>
          </div>
          {featured && fv && (
            <Link href={`/product/${featured.slug}`} className="relative block min-h-[420px] hover:no-underline">
              <ProductImage src={featured.images[0]} alt={featured.name} priority sizes="(min-width: 768px) 640px, 100vw" className="absolute inset-0" imgClassName="object-contain object-left-top p-4 md:object-center md:p-6" />
              <div className="absolute bottom-4 right-4 flex w-[min(280px,calc(100%-32px))] flex-col gap-3 rounded-card border border-border bg-bg p-4 text-text md:bottom-5 md:right-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-small font-medium">
                    {featured.name}
                    {fv.storage ? ` · ${fv.storage}` : ""}
                  </span>
                  {fv.grade && <GradeBadge grade={fv.grade} className="h-6 text-micro" />}
                </div>
                {fv.battery_health != null && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px] text-muted">
                      <span>Battery health</span>
                      <span className="num text-text">{fv.battery_health}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${TONE_BG[batteryTone(fv.battery_health)]}`} style={{ width: `${fv.battery_health}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1.5 text-[13px]">
                  <span className="flex items-center gap-2">
                    <Check size={16} strokeWidth={1.75} className="text-success" />
                    Face ID, cameras, speakers
                  </span>
                  <span className="flex items-center gap-2">
                    <Check size={16} strokeWidth={1.75} className="text-success" />
                    Original screen and battery
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} strokeWidth={1.75} className="text-accent" />
                    {fv.warranty_months ?? 3}-month warranty
                  </span>
                </div>
                <span className="num border-t border-border pt-2.5 text-small text-muted">from {formatNaira(fv.price)}</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="container-site">
        <ul className="grid grid-cols-2 gap-4 border-y border-border py-5 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span className="text-small font-medium leading-tight">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Shop by category */}
      <section className="container-site flex flex-col gap-5">
        <h2 className="h-section">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {catTiles.map((c) => (
            <Link key={c.href} href={c.href} className="group relative aspect-square overflow-hidden rounded-card hover:no-underline">
              <ProductImage src={c.img} alt={c.label} sizes="(min-width: 768px) 300px, 50vw" className="absolute inset-0" imgClassName="transition-transform duration-[250ms] group-hover:scale-[1.03]" />
              <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-btn bg-bg px-3.5 py-2.5 text-[15px] font-medium text-text">
                {c.label}
                <ArrowRight size={16} strokeWidth={1.5} className="text-muted" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash deals */}
      {deals.length > 0 && (
        <section id="deals" className="container-site flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="h-section">Flash deals</h2>
            {dealEnd && <Countdown endsAt={dealEnd} />}
            <Link href="/deals" className="ml-auto text-small font-medium">
              All deals
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
            {deals.map((p) => (
              <div key={p.id} className="w-[64%] shrink-0 snap-start sm:w-[40%] md:w-[calc((100%-48px)/4)]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Just landed */}
      {landed.length > 0 && (
        <section id="landed" className="container-site flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="h-section">Just landed</h2>
            <Link href="/shop?sort=newest" className="text-small font-medium">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {landed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Swap band */}
      <section className="bg-accent-soft">
        <div className="container-site grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div className="flex flex-col gap-3">
            <h2 className="text-[26px] font-semibold tracking-[-0.01em] md:text-h1">What&rsquo;s your old phone worth?</h2>
            <p className="max-w-[440px] text-body text-muted">Get an estimate in under a minute, then trade it in towards any phone in the store.</p>
          </div>
          <MiniEstimator values={swapValues} />
        </div>
      </section>

      {/* Shop by brand */}
      <section className="container-site flex flex-col gap-5">
        <h2 className="h-section">Shop by brand</h2>
        <div className="flex flex-wrap gap-2">
          {BRANDS.filter((b) => b !== "Other" && products.some((p) => p.brand === b)).map((b) => (
            <Link key={b} href={`/shop?brand=${encodeURIComponent(b)}`} className="flex h-11 items-center rounded-full border border-border px-5 text-[15px] font-medium text-text hover:bg-surface hover:no-underline">
              {b}
            </Link>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="container-site flex flex-col gap-5">
        <h2 className="h-section">What customers say</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <figure key={r.id} className="flex flex-col gap-3.5 rounded-card border border-border p-6">
              <div className="flex gap-0.5 text-warning" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={16} strokeWidth={1.5} fill={i < r.rating ? "currentColor" : "none"} />
                ))}
              </div>
              <blockquote className="text-body leading-[1.55]">{r.text}</blockquote>
              <figcaption className="text-small">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted"> · {r.area}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Visit us */}
      <section className="container-site grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 className="h-section">Visit the store</h2>
          <div className="flex flex-col gap-3.5 text-body">
            <div className="flex gap-3">
              <MapPin size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span>{settings.store_address}</span>
            </div>
            <div className="flex gap-3">
              <Clock size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span>{settings.opening_hours}</span>
            </div>
            <div className="flex gap-3">
              <Phone size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="num">{displayPhone(settings.whatsapp_number)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waLink(settings.whatsapp_number, "Hello Gucci Gadgets 👋")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg hover:no-underline">
              <MessageCircle size={18} strokeWidth={1.5} />
              Chat on WhatsApp
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.store_address.replace(/\(placeholder\)/i, ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg hover:no-underline"
            >
              Get directions
            </a>
          </div>
        </div>
        <div
          className="flex aspect-[16/10] items-center justify-center rounded-card border border-border"
          style={{ background: "repeating-linear-gradient(135deg, var(--surface) 0 8px, var(--bg) 8px 16px)" }}
        >
          <span className="rounded-md bg-bg px-2 py-1 font-mono text-micro text-muted">map embed</span>
        </div>
      </section>
    </div>
  );
}
