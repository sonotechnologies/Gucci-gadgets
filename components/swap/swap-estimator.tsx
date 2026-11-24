"use client";
import {
  Banknote,
  Battery,
  Box,
  Check,
  ChevronLeft,
  Circle,
  CircleCheck,
  Fingerprint,
  MessageCircle,
  PenLine,
  RotateCcw,
  Search,
  Smartphone,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { baseVariant, conditionLabel, storages as productStorages, findVariant } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatNaira, storageRank } from "@/lib/format";
import {
  answerLabel,
  estimateBreakdown,
  estimateSwap,
  SWAP_QUESTIONS,
  SWAP_STORAGE_OPTIONS,
  topUp,
  type SwapAnswers,
  type SwapQuestion,
} from "@/lib/swap";
import type { Product, SwapValue } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { ProductImage } from "../product-image";
import { useSettings } from "../providers";
import { OptionCard, Segmented } from "../ui";

const STEPS = ["Your phone", "Condition", "What you want", "Your offer"] as const;
const Q_ICONS: Record<SwapQuestion["icon"], typeof Smartphone> = {
  screen: Smartphone,
  body: Box,
  battery: Battery,
  biometrics: Fingerprint,
  repaired: Wrench,
};
const SAVE_KEY = "gg-swap-v2";

type Target = { kind: "product"; slug: string; storage: string | null } | { kind: "custom"; name: string } | { kind: "cash" } | null;

interface Saved {
  mode: "list" | "custom";
  brand: string;
  model: string | null;
  storage: string | null;
  custom: { brand: string; model: string; storage: string };
  answers: SwapAnswers;
  target: Target;
  step: number;
}

/** Animated number that counts toward its target (respects reduced motion). */
function useCountUp(target: number, duration = 450): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const a = from.current;
    if (reduce || a === target) {
      from.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const v = a + (target - a) * (1 - Math.pow(1 - k, 3));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return shown;
}

const round1k = (n: number) => Math.round(n / 1000) * 1000;

export function SwapEstimator({
  values,
  phones,
  initial,
}: {
  values: SwapValue[];
  phones: Product[];
  initial: { brand?: string; model?: string; target?: string };
}) {
  const settings = useSettings();
  const brands = useMemo(() => [...new Set(values.map((v) => v.brand))], [values]);
  const storagesFor = (m: string | null) =>
    values
      .filter((v) => v.model === m)
      .map((v) => v.storage)
      .sort((a, b) => storageRank(a) - storageRank(b));

  const initModel = values.find((v) => v.model === initial.model);
  const initTarget = phones.find((p) => p.slug === initial.target);
  const [mode, setMode] = useState<"list" | "custom">("list");
  const [brand, setBrand] = useState(initModel?.brand ?? (initial.brand && brands.includes(initial.brand) ? initial.brand : brands[0]));
  const [model, setModel] = useState<string | null>(initModel?.model ?? null);
  const [storage, setStorage] = useState<string | null>(initModel ? storagesFor(initModel.model)[0] : null);
  const [custom, setCustom] = useState({ brand: "", model: "", storage: "128GB" });
  const [answers, setAnswers] = useState<SwapAnswers>({});
  const [target, setTarget] = useState<Target>(initTarget ? { kind: "product", slug: initTarget.slug, storage: baseVariant(initTarget)?.storage ?? null } : null);
  const [step, setStep] = useState(initModel ? 1 : 0);
  const [modelQ, setModelQ] = useState("");
  const [phoneQ, setPhoneQ] = useState("");
  const [restored, setRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const qRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const storageRef = useRef<HTMLDivElement>(null);
  const smooth = (): ScrollBehavior => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  // Restore progress from this browser session (unless the URL asked for something specific).
  useEffect(() => {
    if (initial.model || initial.target) return setRestored(true);
    try {
      const s = JSON.parse(sessionStorage.getItem(SAVE_KEY) ?? "null") as Saved | null;
      if (s) {
        setMode(s.mode);
        setBrand(s.brand);
        setModel(s.model);
        setStorage(s.storage);
        setCustom(s.custom);
        setAnswers(s.answers);
        setTarget(s.target);
        setStep(s.step);
      }
    } catch {}
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(SAVE_KEY, JSON.stringify({ mode, brand, model, storage, custom, answers, target, step } satisfies Saved));
    } catch {}
  }, [restored, mode, brand, model, storage, custom, answers, target, step]);

  const models = useMemo(() => {
    const m = new Map<string, number>();
    values.filter((v) => v.brand === brand).forEach((v) => m.set(v.model, Math.max(m.get(v.model) ?? 0, v.base_value)));
    const t = modelQ.trim().toLowerCase();
    return [...m.entries()].filter(([name]) => !t || name.toLowerCase().includes(t));
  }, [values, brand, modelQ]);

  // ---------- derived ----------
  const sv = mode === "list" ? values.find((v) => v.model === model && v.storage === storage) : undefined;
  const customOk = mode === "custom" && custom.brand.trim().length > 1 && custom.model.trim().length > 1;
  const phoneLabel = mode === "custom" ? [custom.brand.trim(), custom.model.trim(), custom.storage].filter(Boolean).join(" ") : sv ? `${sv.model} · ${sv.storage}` : null;
  const est = sv ? estimateSwap(sv.base_value, answers) : null;
  const breakdown = sv ? estimateBreakdown(sv.base_value, answers) : [];
  const answered = SWAP_QUESTIONS.filter((x) => answers[x.key]).length;
  const allAnswered = answered === SWAP_QUESTIONS.length;

  const targetProduct = target?.kind === "product" ? (phones.find((p) => p.slug === target.slug) ?? null) : null;
  const tv = targetProduct ? findVariant(targetProduct, target?.kind === "product" ? target.storage : null, null) : undefined;
  const targetPrice = target?.kind === "cash" ? 0 : (tv?.price ?? null);
  const pay = est && targetPrice != null ? topUp(targetPrice, est.estimate) : null;

  const shownEst = useCountUp(est?.estimate ?? 0);
  const shownPay = useCountUp(Math.abs(pay ?? 0));

  const stepValid = [mode === "list" ? !!sv : customOk, allAnswered, target?.kind === "custom" ? target.name.trim().length > 1 : !!target, true];
  const canReach = (i: number) => stepValid.slice(0, i).every(Boolean);

  const go = (s: number) => {
    setStep(s);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const pick = (key: keyof SwapAnswers, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    // Guide the eye to the next unanswered question.
    const nextQ = SWAP_QUESTIONS.find((q) => !next[q.key]);
    if (nextQ) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => qRefs.current[nextQ.key]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 120);
    }
  };

  const reset = () => {
    setMode("list");
    setModel(null);
    setStorage(null);
    setCustom({ brand: "", model: "", storage: "128GB" });
    setAnswers({});
    setTarget(null);
    setStep(0);
    try {
      sessionStorage.removeItem(SAVE_KEY);
    } catch {}
  };

  const filteredPhones = useMemo(() => {
    const t = phoneQ.trim().toLowerCase();
    return phones.filter((p) => !t || `${p.name} ${p.brand} ${conditionLabel(p)}`.toLowerCase().includes(t));
  }, [phones, phoneQ]);

  // ---------- WhatsApp message ----------
  const message = useMemo(() => {
    const lines = ["Hello Gucci Gadgets 👋", target?.kind === "cash" ? "I'd like to sell my phone." : "I'd like to swap my phone."];
    lines.push(`My phone: ${phoneLabel ?? "…"}${mode === "custom" ? " (not on your list)" : ""}`);
    SWAP_QUESTIONS.forEach((x) => lines.push(`${x.title.replace(/\?$/, "")}: ${answerLabel(x.key, answers[x.key])}`));
    if (est) lines.push(`Online estimate: ${formatNaira(est.low)} – ${formatNaira(est.high)}`);
    else lines.push("Online estimate: please quote me");
    if (target?.kind === "product" && targetProduct && tv) {
      lines.push(`Phone I want: ${targetProduct.name} — ${[tv.storage, conditionLabel(targetProduct, tv)].filter(Boolean).join(", ")} (${formatNaira(tv.price)})`);
      if (pay != null) lines.push(pay >= 0 ? `Top-up to pay: about ${formatNaira(pay)}` : `You pay me: about ${formatNaira(-pay)}`);
    } else if (target?.kind === "custom") lines.push(`Phone I want: ${target.name.trim()} (please confirm price)`);
    return lines.join("\n");
  }, [phoneLabel, mode, answers, est, target, targetProduct, tv, pay]);

  const payLabel = target?.kind === "cash" || (pay != null && pay < 0) ? "We pay you" : "You pay";
  const payValue = pay != null ? formatNaira(round1k(shownPay)) : target?.kind === "custom" || (target && !est) ? "Quote on WhatsApp" : "—";
  const estValue = est ? formatNaira(round1k(shownEst)) : mode === "custom" && customOk ? "On inspection" : "—";

  // ---------- pieces ----------
  const estimateCard = (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-bg p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-surface text-muted">
          <Smartphone size={20} strokeWidth={1.5} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-micro text-muted">Your phone</span>
          <span className="truncate text-body font-medium">{phoneLabel ?? "Not chosen yet"}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 border-y border-border py-4">
        <span className="text-small text-muted">Your phone is worth</span>
        <span className="num text-[34px] font-medium leading-tight" aria-live="polite">
          {estValue}
        </span>
        <span className="text-[13px] text-muted">
          {est
            ? `Range ${formatNaira(est.low)} – ${formatNaira(est.high)}`
            : mode === "custom"
              ? "We'll price it on WhatsApp"
              : "Pick your model to start"}
        </span>
        {est && (
          <div className="mt-2 flex items-center gap-2" aria-label={`${answered} of ${SWAP_QUESTIONS.length} condition questions answered`}>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${(answered / SWAP_QUESTIONS.length) * 100}%` }} />
            </div>
            <span className="num text-micro text-muted">
              {answered}/{SWAP_QUESTIONS.length}
            </span>
          </div>
        )}
      </div>
      {breakdown.length > 1 && (
        <dl className="flex flex-col gap-1.5 text-[13px]">
          {breakdown.map((l) => (
            <div key={l.label} className="flex justify-between gap-3">
              <dt className="text-muted">{l.label}</dt>
              <dd className={cn("num", l.amount < 0 && "text-deal")}>{l.amount < 0 ? `−${formatNaira(-l.amount)}` : formatNaira(l.amount)}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex justify-between gap-3 text-small">
        <span className="min-w-0 truncate text-muted">
          {target?.kind === "product" && targetProduct ? targetProduct.name : target?.kind === "cash" ? "Cash sale" : target?.kind === "custom" ? target.name || "Phone you want" : "Phone you want"}
        </span>
        <span className="num shrink-0">{tv ? formatNaira(tv.price) : target?.kind === "custom" ? "TBC" : "—"}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{payLabel}</span>
        <span className={cn("num font-medium text-accent", pay != null ? "text-[22px]" : "text-small")}>{payValue}</span>
      </div>
    </div>
  );

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-7 pb-32 lg:pb-0">
      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((label, i) => {
          const done = i < step && stepValid[i];
          const cur = i === step;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!canReach(i)}
                onClick={() => go(i)}
                aria-current={cur ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-start gap-2 border-t-[3px] pt-3 text-left text-[13px] font-medium transition-colors md:flex-row md:items-center md:gap-2.5 md:text-small",
                  cur ? "border-accent text-text" : done ? "border-text text-text" : "border-border text-muted",
                )}
              >
                <span
                  className={cn(
                    "num flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-micro",
                    cur ? "bg-accent text-on-accent" : done ? "bg-text text-bg" : "bg-surface-2 text-muted",
                  )}
                >
                  {done ? <Check size={14} strokeWidth={2.25} /> : i + 1}
                </span>
                <span className="leading-tight">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8">
          {/* ---------- Step 1: your phone ---------- */}
          {step === 0 && (
            <>
              {mode === "list" ? (
                <>
                  <fieldset className="flex flex-col gap-3">
                    <legend className="mb-3 text-h3 font-semibold">Brand</legend>
                    <div className="flex flex-wrap gap-2">
                      {brands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          aria-pressed={b === brand}
                          onClick={() => {
                            setBrand(b);
                            setModel(null);
                            setStorage(null);
                            setModelQ("");
                          }}
                          className={cn("h-11 rounded-full border px-5 text-[15px] font-medium", b === brand ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="flex flex-col gap-3">
                    <legend className="mb-3 flex w-full items-center justify-between gap-3 text-h3 font-semibold">Model</legend>
                    <label className="relative max-w-sm">
                      <span className="sr-only">Search models</span>
                      <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
                      <input value={modelQ} onChange={(e) => setModelQ(e.target.value)} placeholder={`Search ${brand} models`} className="input pl-10" type="search" />
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {models.map(([m, up]) => (
                        <OptionCard
                          key={m}
                          selected={m === model}
                          onClick={() => {
                            setModel(m);
                            setStorage(storagesFor(m)[0] ?? null);
                            setTimeout(() => storageRef.current?.scrollIntoView({ behavior: smooth(), block: "center" }), 80);
                          }}
                          layout="column"
                          className="min-h-[76px] gap-1"
                        >
                          <span className="block">{m}</span>
                          <span className="num block text-micro font-normal text-muted">up to {formatNaira(up)}</span>
                        </OptionCard>
                      ))}
                    </div>
                    {models.length === 0 && <p className="text-small text-muted">No {brand} models match &ldquo;{modelQ}&rdquo;.</p>}
                  </fieldset>
                  {model && (
                    <div ref={storageRef} className="flex max-w-md scroll-mt-28 animate-rise flex-col gap-3">
                      <span className="text-h3 font-semibold">Storage</span>
                      <Segmented label="Storage" mono value={storage ?? ""} onChange={setStorage} options={storagesFor(model).map((s) => ({ value: s, label: s }))} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    className="flex items-center gap-3 self-start rounded-card border border-dashed border-border px-4 py-3 text-left text-[15px] hover:bg-surface"
                  >
                    <PenLine size={20} strokeWidth={1.5} className="shrink-0 text-accent" />
                    <span>
                      <span className="block font-medium">Can&rsquo;t find your phone?</span>
                      <span className="block text-[13px] text-muted">Type it in and we&rsquo;ll price it for you on WhatsApp.</span>
                    </span>
                  </button>
                </>
              ) : (
                <div className="flex max-w-lg animate-rise flex-col gap-4">
                  <button type="button" onClick={() => setMode("list")} className="flex items-center gap-1 self-start text-small text-muted hover:text-text">
                    <ChevronLeft size={16} strokeWidth={1.5} />
                    Back to the list
                  </button>
                  <h2 className="text-h3 font-semibold">Tell us about your phone</h2>
                  <p className="-mt-2 text-small text-muted">Any brand or model works. We&rsquo;ll send you a price on WhatsApp after you answer a few condition questions.</p>
                  <label className="field">
                    Brand
                    <input className="input" value={custom.brand} onChange={(e) => setCustom({ ...custom, brand: e.target.value })} placeholder="e.g. Samsung, Tecno, OnePlus" list="swap-brands" />
                    <datalist id="swap-brands">
                      {["Apple", "Samsung", "Google", "Tecno", "Infinix", "Redmi", "Xiaomi", "OnePlus", "Oppo", "Itel"].map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </label>
                  <label className="field">
                    Model
                    <input className="input" value={custom.model} onChange={(e) => setCustom({ ...custom, model: e.target.value })} placeholder="e.g. Galaxy Z Flip 5" />
                  </label>
                  <div className="field">
                    Storage
                    <Segmented label="Storage" mono value={custom.storage} onChange={(s) => setCustom({ ...custom, storage: s })} options={SWAP_STORAGE_OPTIONS.map((s) => ({ value: s, label: s }))} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---------- Step 2: condition ---------- */}
          {step === 1 && (
            <>
              <p className="-mb-2 text-small text-muted">Be honest: the final price is confirmed when we see the phone, and accurate answers mean no surprises.</p>
              {SWAP_QUESTIONS.map((question, qi) => {
                const Icon = Q_ICONS[question.icon];
                const done = !!answers[question.key];
                return (
                  <fieldset
                    key={question.key}
                    ref={(el) => {
                      qRefs.current[question.key] = el;
                    }}
                    className="flex scroll-mt-28 flex-col gap-3"
                  >
                    <legend className="mb-3 flex items-center gap-2.5 text-h3 font-semibold">
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", done ? "bg-accent-soft text-accent" : "bg-surface text-muted")}>
                        {done ? <Check size={16} strokeWidth={2} /> : <Icon size={18} strokeWidth={1.5} />}
                      </span>
                      <span>
                        <span className="sr-only">Question {qi + 1}: </span>
                        {question.title}
                      </span>
                    </legend>
                    <div className={cn("grid grid-cols-1 gap-3", question.options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                      {question.options.map((o) => {
                        const sel = answers[question.key] === o.value;
                        return (
                          <OptionCard key={o.value} selected={sel} onClick={() => pick(question.key, o.value)} icon={sel ? <CircleCheck size={20} strokeWidth={1.5} /> : <Circle size={20} strokeWidth={1.5} />}>
                            {o.label}
                          </OptionCard>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </>
          )}

          {/* ---------- Step 3: what you want ---------- */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  selected={target?.kind === "cash"}
                  onClick={() => setTarget({ kind: "cash" })}
                  icon={<Banknote size={22} strokeWidth={1.5} />}
                  className="min-h-[72px]"
                >
                  <span className="block">Just sell it for cash</span>
                  <span className="block text-[13px] font-normal text-muted">Paid by transfer after inspection</span>
                </OptionCard>
                <OptionCard
                  selected={target?.kind === "custom"}
                  onClick={() => setTarget({ kind: "custom", name: target?.kind === "custom" ? target.name : "" })}
                  icon={<PenLine size={22} strokeWidth={1.5} />}
                  className="min-h-[72px]"
                >
                  <span className="block">The phone I want isn&rsquo;t listed</span>
                  <span className="block text-[13px] font-normal text-muted">We&rsquo;ll source it and confirm the price</span>
                </OptionCard>
              </div>
              {target?.kind === "custom" && (
                <label className="field max-w-md animate-rise">
                  Which phone do you want?
                  <input className="input" autoFocus value={target.name} onChange={(e) => setTarget({ kind: "custom", name: e.target.value })} placeholder="e.g. iPhone 16 Pro, 256GB, Desert" />
                </label>
              )}

              <div className="flex items-center gap-3 pt-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-small text-muted">or swap for a phone in the store</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {targetProduct && target?.kind === "product" && (
                <div className="flex animate-rise flex-col gap-3 rounded-card border-2 border-accent bg-accent-soft p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProductImage src={targetProduct.images[0]} alt="" sizes="64px" className="h-16 w-16 shrink-0 rounded-lg" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-micro text-muted">You want</span>
                      <span className="text-[15px] font-semibold">{targetProduct.name}</span>
                      <span className="num text-small">{tv ? formatNaira(tv.price) : "—"}</span>
                    </span>
                  </div>
                  {productStorages(targetProduct).length > 1 && (
                    <div className="sm:w-64">
                      <Segmented
                        label="Storage of the phone you want"
                        mono
                        value={target.storage ?? ""}
                        onChange={(st) => setTarget({ kind: "product", slug: targetProduct.slug, storage: st })}
                        options={productStorages(targetProduct).map((st) => ({ value: st, label: st }))}
                      />
                    </div>
                  )}
                </div>
              )}

              <label className="relative max-w-md">
                <span className="sr-only">Search phones</span>
                <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
                <input value={phoneQ} onChange={(e) => setPhoneQ(e.target.value)} placeholder="Search the store" className="input pl-10" type="search" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredPhones.map((p) => {
                  const v = baseVariant(p);
                  const sel = target?.kind === "product" && target.slug === p.slug;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setTarget({ kind: "product", slug: p.slug, storage: v?.storage ?? null })}
                      className={cn("flex items-center gap-3 rounded-card border-2 p-2.5 text-left transition-colors", sel ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                    >
                      <ProductImage src={p.images[0]} alt="" sizes="64px" className="h-16 w-16 shrink-0 rounded-lg" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[15px] font-medium">{p.name}</span>
                        <span className="text-micro text-muted">
                          {conditionLabel(p)} · from <span className="num">{v ? formatNaira(v.price) : "—"}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
                {filteredPhones.length === 0 && <p className="text-small text-muted">No phones match that search. Choose &ldquo;isn&rsquo;t listed&rdquo; above and type it in.</p>}
              </div>
            </div>
          )}

          {/* ---------- Step 4: result ---------- */}
          {step === 3 && (
            <div className="flex animate-rise flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 rounded-card border border-border p-5">
                  <span className="text-small text-muted">Your phone is worth</span>
                  <span className="num text-h2 font-medium">{est ? `${formatNaira(est.low)} – ${formatNaira(est.high)}` : "Priced on WhatsApp"}</span>
                  <span className="text-[13px] text-muted">{phoneLabel}</span>
                </div>
                <div className="flex flex-col gap-1.5 rounded-card border border-border p-5">
                  {targetProduct && target?.kind === "product" && (
                    <ProductImage src={targetProduct.images[0]} alt={targetProduct.name} sizes="96px" className="mb-2 h-20 w-20 rounded-btn" />
                  )}
                  <span className="text-small text-muted">{target?.kind === "cash" ? "You get" : "Phone you want"}</span>
                  <span className="num text-h2 font-medium">{target?.kind === "cash" ? "Cash" : tv ? formatNaira(tv.price) : "Price TBC"}</span>
                  <span className="text-[13px] text-muted">
                    {target?.kind === "product" && targetProduct
                      ? `${targetProduct.name}${tv?.storage ? ` · ${tv.storage}` : ""}`
                      : target?.kind === "custom"
                        ? target.name
                        : "Bank transfer after inspection"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 rounded-card bg-accent-soft p-6">
                <span className="text-[15px] font-medium">{payLabel}</span>
                <span className="num text-[36px] font-medium leading-tight text-accent md:text-[48px]">{pay != null ? formatNaira(round1k(shownPay)) : "We'll confirm on WhatsApp"}</span>
                <span className="text-[13px] text-muted">
                  {pay != null ? "Based on the middle of your estimate range." : "Send your answers and we'll reply with an exact figure, usually within the hour."}
                </span>
              </div>
              <ol className="grid gap-2 rounded-card border border-border p-5 text-small sm:grid-cols-3">
                {["Send your request on WhatsApp", "We confirm the price and a time", target?.kind === "cash" ? "Inspect, then get paid by transfer" : "Inspect, swap and move your data"].map((t, i) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-micro font-medium">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="text-[13px] leading-normal text-muted">
                Final value is confirmed after physical inspection. Bring the phone to the store or we can inspect it on pickup. Estimates are valid for 7 days.
              </p>
              <a href={waLink(settings.whatsapp_number, message)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp h-14 w-full text-[17px] hover:no-underline">
                <MessageCircle size={20} strokeWidth={1.5} />
                {target?.kind === "cash" ? "Send sell request on WhatsApp" : "Send swap request on WhatsApp"}
              </a>
              <button type="button" onClick={reset} className="btn btn-ghost self-center text-muted">
                <RotateCcw size={16} strokeWidth={1.5} />
                Start a new estimate
              </button>
            </div>
          )}

          {/* Desktop nav (the result step has its own actions; the stepper handles going back) */}
          <div className={cn("hidden justify-between gap-3 pt-2", step < 3 && "lg:flex")}>
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className="btn btn-secondary btn-lg">
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 && (
              <button type="button" disabled={!stepValid[step]} onClick={() => go(step + 1)} className="btn btn-primary btn-lg">
                {step === 2 ? "See my offer" : "Continue"}
              </button>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Live estimate">
          {estimateCard}
        </aside>
      </div>

      {/* Mobile: estimate + primary action in the thumb zone */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
            <span className="text-micro text-muted">{step === 3 || pay != null ? payLabel : "Your phone is worth"}</span>
            <span className={cn("num truncate font-medium", (step === 3 || pay != null ? payValue : estValue).length > 12 ? "text-small" : "text-[20px]", (step === 3 || pay != null) && "text-accent")}>
              {step === 3 || pay != null ? payValue : estValue}
            </span>
          </div>
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} aria-label="Back" className="btn btn-secondary h-12 w-12 px-0">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
          )}
          {step < 3 ? (
            <button type="button" disabled={!stepValid[step]} onClick={() => go(step + 1)} className="btn btn-primary btn-lg px-6">
              {step === 2 ? "See offer" : step === 1 ? `Continue · ${answered}/5` : "Continue"}
            </button>
          ) : (
            <a href={waLink(settings.whatsapp_number, message)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg px-5 hover:no-underline">
              <MessageCircle size={18} strokeWidth={1.5} />
              Send
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
