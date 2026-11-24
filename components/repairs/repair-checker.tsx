"use client";
import {
  BatteryLow,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  Droplets,
  Layers,
  MessageCircle,
  PenLine,
  PlugZap,
  ScanFace,
  Search,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { REPAIR_ISSUES, type RepairIssue, type RepairPrice } from "@/lib/types";
import { LAGOS_AREAS, waLink } from "@/lib/whatsapp";
import { useSettings } from "../providers";
import { Segmented } from "../ui";

const ISSUES: Record<RepairIssue, { icon: typeof Smartphone; hint: string }> = {
  Screen: { icon: Smartphone, hint: "Cracked, black, lines or touch not working" },
  Battery: { icon: BatteryLow, hint: "Drains fast, swollen or health below 80%" },
  "Charging port": { icon: PlugZap, hint: "Loose cable, slow or no charging" },
  "Back glass": { icon: Layers, hint: "Cracked or shattered back" },
  Camera: { icon: Camera, hint: "Blurry, black or shaking photos" },
  "Face ID": { icon: ScanFace, hint: "Face ID or fingerprint stopped working" },
  "Water damage": { icon: Droplets, hint: "Dropped in water, won't turn on" },
};

const DURATION_RANK = (d: string) => (/same/i.test(d) ? 0 : /1.?2/.test(d) ? 1 : 2);

const formSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number"),
  address: z.string(),
});

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function RepairChecker({ prices }: { prices: RepairPrice[] }) {
  const settings = useSettings();
  const brands = useMemo(() => [...new Set(prices.map((p) => p.brand))], [prices]);
  const [brand, setBrand] = useState(brands[0] ?? "Apple");
  const [device, setDevice] = useState<string | null>(null);
  const [customDevice, setCustomDevice] = useState<string | null>(null); // non-null = typing a device not on the list
  const [issues, setIssues] = useState<RepairIssue[]>([]);
  const [modelQ, setModelQ] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", note: "", mode: "Drop-off" as "Drop-off" | "Pickup", area: "Lekki", address: "", day: "Today" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [listBrand, setListBrand] = useState<string>("All");
  const [q, setQ] = useState("");
  const quoteRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formVisible, setFormVisible] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const models = useMemo(() => {
    const t = modelQ.trim().toLowerCase();
    return [...new Set(prices.filter((p) => p.brand === brand).map((p) => p.model))].filter((m) => !t || m.toLowerCase().includes(t));
  }, [prices, brand, modelQ]);

  const deviceName = customDevice != null ? customDevice.trim() : device;
  const lines = issues.map((i) => ({ issue: i, price: customDevice == null ? prices.find((p) => p.model === device && p.issue === i) : undefined }));
  const known = lines.filter((l) => l.price);
  const total = known.reduce((s, l) => s + l.price!.price_from, 0);
  const longest = known.map((l) => l.price!.duration).sort((a, b) => DURATION_RANK(b) - DURATION_RANK(a))[0];
  const hasUnknown = lines.some((l) => !l.price);
  const ready = !!deviceName && deviceName.length > 1 && issues.length > 0;

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  });

  const toggleIssue = (i: RepairIssue) => setIssues((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const days = ["Today", "Tomorrow", todayPlus(2), todayPlus(3)];

  const msg = [
    "Hello Gucci Gadgets 👋",
    "I'd like to book a repair.",
    `Device: ${deviceName || "…"}${customDevice != null ? " (not on your list)" : ""}`,
    `Repair${issues.length > 1 ? "s" : ""}: ${issues.join(", ") || "…"}`,
    known.length ? `Quoted online: from ${formatNaira(total)}${hasUnknown ? " + items to price on inspection" : ""}` : "Quoted online: price on inspection",
    form.note.trim() ? `Details: ${form.note.trim()}` : null,
    `Name: ${form.name.trim() || "…"}`,
    `Phone: ${form.phone.trim() || "…"}`,
    form.mode === "Pickup" ? `Pickup: ${form.address.trim() ? form.address.trim() + ", " : ""}${form.area} · ${form.day}` : `Drop-off at the store · ${form.day}`,
  ]
    .filter(Boolean)
    .join("\n");

  const send = () => {
    const r = formSchema.safeParse(form);
    const e: Record<string, string> = {};
    if (!r.success) r.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
    if (form.mode === "Pickup" && form.address.trim().length < 5) e.address = "Add a street address for pickup";
    setErrors(e);
    if (Object.keys(e).length) return;
    window.open(waLink(settings.whatsapp_number, msg), "_blank", "noopener,noreferrer");
  };

  const chooseFromList = (p: RepairPrice) => {
    setBrand(p.brand);
    setCustomDevice(null);
    setDevice(p.model);
    setIssues((cur) => (cur.includes(p.issue) && device === p.model ? cur : device === p.model ? [...cur, p.issue] : [p.issue]));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => quoteRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 50);
  };

  const listGroups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const rows = prices.filter((p) => (listBrand === "All" || p.brand === listBrand) && (!t || `${p.brand} ${p.model} ${p.issue}`.toLowerCase().includes(t)));
    const m = new Map<string, RepairPrice[]>();
    rows.forEach((r) => m.set(r.model, [...(m.get(r.model) ?? []), r]));
    return [...m.entries()];
  }, [prices, listBrand, q]);

  return (
    <div ref={topRef} className="flex flex-col gap-10">
      {/* ---------- 1. Device ---------- */}
      <section className="flex flex-col gap-4" aria-labelledby="dev">
        <h2 id="dev" className="flex items-center gap-3 text-h3 font-semibold">
          <span className={cn("num flex h-8 w-8 items-center justify-center rounded-full text-small", deviceName ? "bg-accent-soft text-accent" : "bg-surface text-muted")}>
            {deviceName ? <Check size={16} strokeWidth={2} /> : 1}
          </span>
          Your device
        </h2>
        {customDevice == null ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={b === brand}
                  onClick={() => {
                    setBrand(b);
                    setModelQ("");
                  }}
                  className={cn("h-11 rounded-full border px-5 text-[15px] font-medium", b === brand ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                >
                  {b}
                </button>
              ))}
              <label className="relative ml-auto w-full sm:w-64">
                <span className="sr-only">Search models</span>
                <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
                <input value={modelQ} onChange={(e) => setModelQ(e.target.value)} placeholder={`Search ${brand}`} className="input pl-10" type="search" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === device}
                  onClick={() => setDevice(m)}
                  className={cn(
                    "flex h-12 items-center gap-2 rounded-btn border-2 px-4 text-[15px] font-medium transition-colors",
                    m === device ? "border-accent bg-accent-soft" : "border-border hover:bg-surface",
                  )}
                >
                  <Smartphone size={18} strokeWidth={1.5} className={m === device ? "text-accent" : "text-muted"} />
                  {m}
                </button>
              ))}
              {models.length === 0 && <p className="text-small text-muted">No {brand} models match that search.</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomDevice("");
                setDevice(null);
              }}
              className="flex items-center gap-3 self-start rounded-card border border-dashed border-border px-4 py-3 text-left text-[15px] hover:bg-surface"
            >
              <PenLine size={20} strokeWidth={1.5} className="shrink-0 text-accent" />
              <span>
                <span className="block font-medium">Device not listed?</span>
                <span className="block text-[13px] text-muted">Any phone, tablet or watch. We&rsquo;ll price it after a free diagnosis.</span>
              </span>
            </button>
          </>
        ) : (
          <div className="flex max-w-md animate-rise flex-col gap-3">
            <button type="button" onClick={() => setCustomDevice(null)} className="flex items-center gap-1 self-start text-small text-muted hover:text-text">
              <ChevronLeft size={16} strokeWidth={1.5} />
              Back to the list
            </button>
            <label className="field">
              Brand and model
              <input className="input" autoFocus value={customDevice} onChange={(e) => setCustomDevice(e.target.value)} placeholder="e.g. Tecno Camon 30, iPad Air 5" />
            </label>
          </div>
        )}
      </section>

      {/* ---------- 2. Issues ---------- */}
      <section className="flex flex-col gap-4" aria-labelledby="iss">
        <div className="flex flex-col gap-1">
          <h2 id="iss" className="flex items-center gap-3 text-h3 font-semibold">
            <span className={cn("num flex h-8 w-8 items-center justify-center rounded-full text-small", issues.length ? "bg-accent-soft text-accent" : "bg-surface text-muted")}>
              {issues.length ? <Check size={16} strokeWidth={2} /> : 2}
            </span>
            What needs fixing?
          </h2>
          <p className="pl-11 text-small text-muted">Pick everything that applies. We&rsquo;ll fix it all in one visit.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPAIR_ISSUES.map((i) => {
            const { icon: Icon, hint } = ISSUES[i];
            const sel = issues.includes(i);
            const p = customDevice == null && device ? prices.find((x) => x.model === device && x.issue === i) : undefined;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={sel}
                onClick={() => toggleIssue(i)}
                className={cn(
                  "relative flex min-h-[112px] flex-col justify-between gap-3 rounded-card border-2 p-4 text-left transition-colors duration-150",
                  sel ? "border-accent bg-accent-soft" : "border-border hover:bg-surface",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <Icon size={24} strokeWidth={1.5} className={sel ? "text-accent" : "text-muted"} />
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border-2", sel ? "border-accent bg-accent text-on-accent" : "border-border")}>
                    {sel && <Check size={14} strokeWidth={2.5} />}
                  </span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium">{i}</span>
                  <span className="text-[13px] leading-snug text-muted">{hint}</span>
                  {device && customDevice == null && (
                    <span className="num pt-1 text-[13px] font-medium">{p ? `from ${formatNaira(p.price_from)}` : "Price on inspection"}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- 3. Quote + booking ---------- */}
      <div ref={quoteRef} className="scroll-mt-24">
        {ready ? (
          <div className="grid animate-rise items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col gap-4 rounded-card bg-accent-soft p-6 lg:sticky lg:top-24">
              <span className="text-small text-muted">Your quote · {deviceName}</span>
              <dl className="flex flex-col gap-2">
                {lines.map((l) => (
                  <div key={l.issue} className="flex items-baseline justify-between gap-3 text-[15px]">
                    <dt>{l.issue}</dt>
                    <dd className="num">{l.price ? formatNaira(l.price.price_from) : <span className="text-small text-muted">on inspection</span>}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-1 border-t border-border pt-4">
                <span className="text-small text-muted">{known.length ? "Total from" : "Price"}</span>
                <span className="num text-[34px] font-medium leading-tight text-accent">{known.length ? formatNaira(total) : "After free diagnosis"}</span>
                {hasUnknown && known.length > 0 && <span className="text-[13px] text-muted">+ items we&rsquo;ll price after a free diagnosis</span>}
              </div>
              <div className="flex flex-col gap-2 text-small">
                {longest && (
                  <span className="flex items-center gap-2 font-medium">
                    <Clock size={16} strokeWidth={1.5} />
                    Ready {longest.toLowerCase().startsWith("same") ? "the same day" : `in ${longest.toLowerCase()}`}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} strokeWidth={1.5} className="text-accent" />
                  3-month warranty on every part we fit
                </span>
                <span className="flex items-center gap-2">
                  <Wrench size={16} strokeWidth={1.5} className="text-accent" />
                  Free diagnosis, no fix no fee
                </span>
              </div>
            </div>

            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex scroll-mt-20 flex-col gap-4 rounded-card border border-border p-6"
              noValidate
            >
              <h2 className="flex items-center gap-3 text-h3 font-semibold">
                <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-surface text-small text-muted">3</span>
                Book your repair
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  Your name
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Adaeze Okafor" autoComplete="name" aria-invalid={!!errors.name} />
                  {errors.name && <span className="text-[13px] text-deal">{errors.name}</span>}
                </label>
                <label className="field">
                  Phone number
                  <input
                    className="input font-mono"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0803 000 0000"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && <span className="text-[13px] text-deal">{errors.phone}</span>}
                </label>
              </div>
              <div className="field">
                Drop it off or we pick it up?
                <Segmented
                  label="Drop-off or pickup"
                  value={form.mode}
                  onChange={(mode) => setForm({ ...form, mode })}
                  options={[
                    { value: "Drop-off", label: "I'll drop it off" },
                    { value: "Pickup", label: "Pick it up" },
                  ]}
                />
                {form.mode === "Drop-off" && <span className="text-micro">{settings.store_address} · {settings.opening_hours}</span>}
              </div>
              {form.mode === "Pickup" && (
                <div className="grid animate-rise gap-4 sm:grid-cols-[1fr_1.4fr]">
                  <label className="field">
                    Area
                    <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                      {LAGOS_AREAS.filter((a) => a !== "Outside Lagos").map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Street address
                    <input
                      className="input"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="House number and street"
                      autoComplete="street-address"
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && <span className="text-[13px] text-deal">{errors.address}</span>}
                  </label>
                </div>
              )}
              <div className="field">
                When?
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred day">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="radio"
                      aria-checked={form.day === d}
                      onClick={() => setForm({ ...form, day: d })}
                      className={cn("h-10 rounded-full border px-4 text-small font-medium text-text", form.day === d ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                Anything else? (optional)
                <textarea className="input h-auto min-h-[80px] py-2.5" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. dropped it last week, screen flickers" />
              </label>
              <button type="submit" className="btn btn-whatsapp h-[52px] text-body">
                <MessageCircle size={18} strokeWidth={1.5} />
                Book on WhatsApp
              </button>
              <p className="text-center text-micro text-muted">No payment now. You only pay after the repair is done and tested.</p>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-card border border-dashed border-border p-5 text-small text-muted">
            <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface">3</span>
            {deviceName ? "Pick at least one repair to see your quote and book." : "Choose your device and what needs fixing to see your quote."}
          </div>
        )}
      </div>

      {ready && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-bg px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 transition-transform duration-200 md:hidden",
            formVisible ? "translate-y-full" : "translate-y-0",
          )}
          aria-hidden={formVisible}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-micro text-muted">
              {deviceName} · {issues.length} repair{issues.length > 1 ? "s" : ""}
            </span>
            <span className="num text-[18px] font-medium text-accent">{known.length ? `from ${formatNaira(total)}` : "Free diagnosis"}</span>
          </div>
          <button
            type="button"
            tabIndex={formVisible ? -1 : 0}
            onClick={() => {
              formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
              setTimeout(() => (formRef.current?.querySelector("input") as HTMLInputElement | null)?.focus({ preventScroll: true }), 400);
            }}
            className="btn btn-whatsapp btn-lg px-5"
          >
            <MessageCircle size={18} strokeWidth={1.5} />
            Book
          </button>
        </div>
      )}

      {/* ---------- Price list ---------- */}
      <section className="flex flex-col gap-4 pt-4" aria-labelledby="price-list">
        <div className="flex flex-col gap-1">
          <h2 id="price-list" className="h-section">
            Price list
          </h2>
          <p className="text-small text-muted">Tap a price to add it to your quote.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["All", ...brands].map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={listBrand === b}
              onClick={() => setListBrand(b)}
              className={cn("h-10 rounded-full border px-4 text-small font-medium", listBrand === b ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
            >
              {b}
            </button>
          ))}
          <label className="relative ml-auto w-full sm:w-72">
            <span className="sr-only">Search repairs</span>
            <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device or repair" className="input pl-10" type="search" />
          </label>
        </div>
        {listGroups.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listGroups.map(([model, rows]) => (
              <div key={model} className="flex flex-col rounded-card border border-border">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <Smartphone size={18} strokeWidth={1.5} className="text-muted" />
                  <span className="text-[15px] font-semibold">{model}</span>
                </div>
                {rows.map((r) => {
                  const Icon = ISSUES[r.issue].icon;
                  const active = device === model && customDevice == null && issues.includes(r.issue);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => chooseFromList(r)}
                      aria-pressed={active}
                      className={cn("flex min-h-12 items-center gap-3 px-4 py-2 text-left text-small hover:bg-surface", active && "bg-accent-soft")}
                    >
                      <Icon size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
                      <span className="flex-1">{r.issue}</span>
                      <span className="text-micro text-muted">{r.duration}</span>
                      <span className="num w-[88px] text-right font-medium">{formatNaira(r.price_from)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-border p-6 text-small text-muted">No repairs match that search. Choose &ldquo;Device not listed?&rdquo; above and we&rsquo;ll quote you.</p>
        )}
      </section>
    </div>
  );
}
