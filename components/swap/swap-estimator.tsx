"use client";
import { Battery, Box, Fingerprint, MessageCircle, Search, Smartphone, Wrench, CircleCheck, Circle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { baseVariant, conditionLabel } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatNaira, storageRank } from "@/lib/format";
import { answerLabel, estimateSwap, SWAP_QUESTIONS, topUp, type SwapAnswers, type SwapQuestion } from "@/lib/swap";
import type { Product, SwapValue } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { ProductImage } from "../product-image";
import { useSettings } from "../providers";
import { OptionCard, Segmented } from "../ui";

const STEPS = ["Your phone", "Condition", "Phone you want", "Result"] as const;
const Q_ICONS: Record<SwapQuestion["icon"], typeof Smartphone> = {
  screen: Smartphone,
  body: Box,
  battery: Battery,
  biometrics: Fingerprint,
  repaired: Wrench,
};

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
      const e = 1 - Math.pow(1 - k, 3);
      const v = a + (target - a) * e;
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return shown;
}

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
  const initModel = values.find((v) => v.model === initial.model);
  const [brand, setBrand] = useState(initModel?.brand ?? (initial.brand && brands.includes(initial.brand) ? initial.brand : brands[0]));
  const [model, setModel] = useState<string | null>(initModel?.model ?? null);
  const storagesFor = (m: string | null) =>
    values
      .filter((v) => v.model === m)
      .map((v) => v.storage)
      .sort((a, b) => storageRank(a) - storageRank(b));
  const [storage, setStorage] = useState<string | null>(initModel ? storagesFor(initModel.model)[0] : null);
  const [answers, setAnswers] = useState<SwapAnswers>({});
  const [targetSlug, setTargetSlug] = useState<string | null>(phones.some((p) => p.slug === initial.target) ? initial.target! : null);
  const [q, setQ] = useState("");
  const [step, setStep] = useState(initModel ? 1 : 0);
  const topRef = useRef<HTMLDivElement>(null);

  const models = useMemo(() => {
    const m = new Map<string, number>();
    values.filter((v) => v.brand === brand).forEach((v) => m.set(v.model, Math.max(m.get(v.model) ?? 0, v.base_value)));
    return [...m.entries()];
  }, [values, brand]);

  const sv = values.find((v) => v.model === model && v.storage === storage);
  const est = sv ? estimateSwap(sv.base_value, answers) : null;
  const target = phones.find((p) => p.slug === targetSlug) ?? null;
  const tv = target ? baseVariant(target) : undefined;
  const pay = est && tv ? topUp(tv.price, est.estimate) : null;
  const answered = SWAP_QUESTIONS.filter((x) => answers[x.key]).length;

  const shownEst = useCountUp(est?.estimate ?? 0);
  const shownPay = useCountUp(pay ?? 0);

  const canNext = [!!sv, answered === SWAP_QUESTIONS.length, !!target, false][step];
  const go = (s: number) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredPhones = useMemo(() => {
    const t = q.trim().toLowerCase();
    return phones.filter((p) => !t || `${p.name} ${p.brand} ${conditionLabel(p)}`.toLowerCase().includes(t));
  }, [phones, q]);

  const message = useMemo(() => {
    if (!sv || !est) return "";
    const lines = [
      "Hello Gucci Gadgets 👋",
      "I'd like to swap my phone.",
      `My phone: ${sv.model} ${sv.storage}`,
      ...SWAP_QUESTIONS.map((x) => `${x.title.replace(/\?$/, "")}: ${answerLabel(x.key, answers[x.key])}`),
      `Estimate: ${formatNaira(est.low)} – ${formatNaira(est.high)}`,
    ];
    if (target && tv) {
      lines.push(`Phone I want: ${target.name} — ${[tv.storage, conditionLabel(target, tv)].filter(Boolean).join(", ")} (${formatNaira(tv.price)})`);
      lines.push(pay! >= 0 ? `Top-up to pay: about ${formatNaira(pay!)}` : `You pay me: about ${formatNaira(-pay!)}`);
    }
    return lines.join("\n");
  }, [sv, est, answers, target, tv, pay]);

  const payLabel = pay != null && pay < 0 ? "We'll pay you the difference" : "You pay";

  const estimateCard = (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-bg p-6">
      <span className="text-small text-muted">Estimate for</span>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-surface text-muted">
          <Smartphone size={20} strokeWidth={1.5} />
        </span>
        <span className="text-body font-medium">{sv ? `${sv.model} · ${sv.storage}` : "Choose your phone"}</span>
      </div>
      <div className="flex flex-col gap-1 border-y border-border py-4">
        <span className="text-small text-muted">Your phone is worth</span>
        <span className="num text-[36px] font-medium leading-tight" aria-live="polite">
          {est ? formatNaira(Math.round(shownEst / 1000) * 1000) : "—"}
        </span>
        <span className="text-[13px] text-muted">
          {est ? `Range ${formatNaira(est.low)} – ${formatNaira(est.high)} · ${answered} of ${SWAP_QUESTIONS.length} answered` : "Pick a model and storage to start"}
        </span>
      </div>
      <div className="flex justify-between gap-3 text-small">
        <span className="text-muted">{target ? target.name : "Phone you want"}</span>
        <span className="num">{tv ? formatNaira(tv.price) : "—"}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{payLabel}</span>
        <span className="num text-[22px] font-medium text-accent">{pay != null ? formatNaira(Math.abs(Math.round(shownPay / 1000) * 1000)) : "—"}</span>
      </div>
    </div>
  );

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-7 pb-24 lg:pb-0">
      {/* Stepper */}
      <ol className="no-scrollbar flex gap-2 overflow-x-auto">
        {STEPS.map((label, i) => {
          const done = i < step;
          const cur = i === step;
          const reachable = i <= step || (i === 1 && !!sv) || (i === 2 && !!sv && answered === 5) || (i === 3 && !!sv && answered === 5 && !!target);
          return (
            <li key={label} className="min-w-[132px] flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => go(i)}
                aria-current={cur ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 border-b-2 pb-3 text-left text-small font-medium transition-colors",
                  cur ? "border-accent text-text" : done ? "border-text text-text" : "border-border text-muted",
                )}
              >
                <span
                  className={cn(
                    "num flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-micro",
                    cur ? "bg-accent text-on-accent" : done ? "bg-text text-bg" : "bg-surface-2 text-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {step === 0 && (
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
                      }}
                      className={cn("h-11 rounded-full border px-5 text-[15px] font-medium", b === brand ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-h3 font-semibold">Model</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {models.map(([m, up]) => (
                    <OptionCard
                      key={m}
                      selected={m === model}
                      onClick={() => {
                        setModel(m);
                        setStorage(storagesFor(m)[0] ?? null);
                      }}
                      layout="column"
                      className="min-h-[76px] gap-1"
                    >
                      <span className="block">{m}</span>
                      <span className="num block text-micro font-normal text-muted">up to {formatNaira(up)}</span>
                    </OptionCard>
                  ))}
                </div>
              </fieldset>
              {model && (
                <div className="flex max-w-md flex-col gap-3">
                  <span className="text-h3 font-semibold">Storage</span>
                  <Segmented label="Storage" mono value={storage ?? ""} onChange={setStorage} options={storagesFor(model).map((s) => ({ value: s, label: s }))} />
                </div>
              )}
            </>
          )}

          {step === 1 &&
            SWAP_QUESTIONS.map((question) => {
              const Icon = Q_ICONS[question.icon];
              return (
                <fieldset key={question.key} className="flex flex-col gap-3">
                  <legend className="mb-3 flex items-center gap-2.5 text-h3 font-semibold">
                    <Icon size={20} strokeWidth={1.5} className="text-muted" />
                    {question.title}
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {question.options.map((o) => {
                      const sel = answers[question.key] === o.value;
                      return (
                        <OptionCard
                          key={o.value}
                          selected={sel}
                          onClick={() => setAnswers((a) => ({ ...a, [question.key]: o.value }))}
                          icon={sel ? <CircleCheck size={20} strokeWidth={1.5} /> : <Circle size={20} strokeWidth={1.5} />}
                        >
                          {o.label}
                        </OptionCard>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-h3 font-semibold">Which phone do you want?</h2>
              <label className="relative max-w-md">
                <span className="sr-only">Search phones</span>
                <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the store" className="input pl-10" type="search" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredPhones.map((p) => {
                  const v = baseVariant(p);
                  const sel = p.slug === targetSlug;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setTargetSlug(p.slug)}
                      className={cn("flex items-center gap-3 rounded-card border-2 p-2.5 text-left", sel ? "border-accent bg-accent-soft" : "border-border hover:bg-surface")}
                    >
                      <ProductImage src={p.images[0]} alt="" sizes="56px" className="h-14 w-14 shrink-0 rounded-lg" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[15px] font-medium">{p.name}</span>
                        <span className="text-micro text-muted">
                          {conditionLabel(p)} · <span className="num">{v ? formatNaira(v.price) : "—"}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
                {filteredPhones.length === 0 && <p className="text-small text-muted">No phones match that search.</p>}
              </div>
            </div>
          )}

          {step === 3 && est && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 rounded-card border border-border p-5">
                  <span className="text-small text-muted">Your phone is worth</span>
                  <span className="num text-h2 font-medium">
                    {formatNaira(est.low)} – {formatNaira(est.high)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {sv?.model} · {sv?.storage}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 rounded-card border border-border p-5">
                  <span className="text-small text-muted">New phone</span>
                  <span className="num text-h2 font-medium">{tv ? formatNaira(tv.price) : "—"}</span>
                  <span className="text-[13px] text-muted">{target ? `${target.name}${tv?.storage ? ` · ${tv.storage}` : ""}` : "No phone chosen"}</span>
                </div>
              </div>
              {pay != null && (
                <div className="flex flex-col gap-1.5 rounded-card bg-accent-soft p-6">
                  <span className="text-[15px] font-medium">{payLabel}</span>
                  <span className="num text-[36px] font-medium leading-tight text-accent md:text-[48px]">{formatNaira(Math.abs(Math.round(shownPay / 1000) * 1000))}</span>
                  <span className="text-[13px] text-muted">Based on the middle of your estimate range.</span>
                </div>
              )}
              <p className="text-[13px] leading-normal text-muted">
                Final value is confirmed after physical inspection. Bring the phone to the store or we can inspect it on pickup. Estimates are valid for 7 days.
              </p>
              <a href={waLink(settings.whatsapp_number, message)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp h-14 w-full text-[17px] hover:no-underline">
                <MessageCircle size={20} strokeWidth={1.5} />
                Send swap request on WhatsApp
              </a>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className="btn btn-secondary btn-lg">
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 && (
              <button type="button" disabled={!canNext} onClick={() => go(step + 1)} className="btn btn-primary btn-lg">
                {step === 2 ? "See my result" : "Continue"}
              </button>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Live estimate">
          {estimateCard}
        </aside>
      </div>

      {/* Mobile bottom estimate card */}
      <div className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-card border border-border bg-bg px-4 py-3.5 shadow-float lg:hidden" aria-live="polite">
        <div className="flex flex-col">
          <span className="text-micro text-muted">Your phone is worth</span>
          <span className="num text-[20px] font-medium">{est ? formatNaira(Math.round(shownEst / 1000) * 1000) : "—"}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-micro text-muted">{pay != null && pay < 0 ? "We pay you" : "You pay"}</span>
          <span className="num text-body font-medium text-accent">{pay != null ? formatNaira(Math.abs(Math.round(shownPay / 1000) * 1000)) : "—"}</span>
        </div>
      </div>
    </div>
  );
}
