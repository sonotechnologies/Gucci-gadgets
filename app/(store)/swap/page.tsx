import { BadgeCheck, Clock, Repeat, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { SwapEstimator } from "@/components/swap/swap-estimator";
import { isInStock, isPhone } from "@/lib/catalog";
import { getProducts, getSwapValues } from "@/lib/data";

export const metadata: Metadata = {
  title: "Swap or sell your phone",
  description: "Find out what your old iPhone, Samsung or any phone is worth in under a minute, then trade it in towards any phone in the store or sell it for cash.",
  alternates: { canonical: "/swap" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const PERKS = [
  { icon: Clock, label: "Estimate in under a minute" },
  { icon: BadgeCheck, label: "Free 15-minute inspection" },
  { icon: Repeat, label: "Swap the same day" },
  { icon: ShieldCheck, label: "Your data wiped in front of you" },
];

const HOW = [
  { t: "Get your estimate", d: "Pick your phone, answer five honest condition questions and choose what you want instead." },
  { t: "Send it on WhatsApp", d: "Your answers and estimate go to us in one message. We confirm stock and a time that suits you." },
  { t: "Inspect and swap", d: "Bring the phone in or we pick it up. We check it in front of you, move your data, and you leave with the new one." },
];

const FAQ = [
  {
    q: "Why might the final price be different from the estimate?",
    a: "The estimate uses your answers. When we see the phone we check the same things: screen, body, battery health, Face ID or fingerprint, and signs of repair. If everything matches what you told us, you get a price inside your range.",
  },
  {
    q: "My phone isn't on the list. Can I still swap?",
    a: "Yes. Tap \"Can't find your phone?\", type the brand and model, and we'll send you a price on WhatsApp, usually within the hour.",
  },
  {
    q: "Can I sell my phone without buying another?",
    a: "Yes. Choose \"Just sell it for cash\" in step 3. We pay by bank transfer as soon as the inspection is done.",
  },
  {
    q: "What should I bring?",
    a: "The phone, its charger if you have it, and a valid ID. Sign out of iCloud or your Google account before you come, or we'll help you do it.",
  },
];

export default async function SwapPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [values, products] = await Promise.all([getSwapValues(), getProducts()]);
  const phones = products.filter((p) => isPhone(p) && isInStock(p));
  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface">
        <div className="container-site flex flex-col gap-5 py-8 md:py-12">
          <span className="font-mono text-micro tracking-[0.04em] text-muted">SWAP · SELL · UPGRADE</span>
          <h1 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">What&rsquo;s your old phone worth?</h1>
          <p className="max-w-xl text-body text-muted">Answer a few quick questions. Your estimate updates as you go, and you&rsquo;ll see exactly how we worked it out.</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 md:flex md:gap-6">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-small font-medium">
                <Icon size={18} strokeWidth={1.5} className="shrink-0 text-accent" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-site py-8 md:py-10">
        <SwapEstimator values={values} phones={phones} initial={{ brand: one(sp.brand), model: one(sp.model), target: one(sp.target) }} />
      </div>

      <section className="container-site flex flex-col gap-6 pb-32 pt-4 md:pb-16" aria-labelledby="how">
        <h2 id="how" className="h-section">
          How swapping works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {HOW.map((s, i) => (
            <li key={s.t} className="flex flex-col gap-3 rounded-card border border-border p-6">
              <span className="num flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-small font-medium text-accent">{i + 1}</span>
              <h3 className="text-h3 font-semibold">{s.t}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        <h2 className="h-section pt-6">Questions</h2>
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                {f.q}
                <span className="text-h3 text-muted transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-4 text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
