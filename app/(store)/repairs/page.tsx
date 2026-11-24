import { BadgeCheck, Clock, ShieldCheck, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import { RepairChecker } from "@/components/repairs/repair-checker";
import { getRepairPrices } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Phone repairs in Lagos",
  description: "Screen, battery, charging port, camera and Face ID repairs for iPhone, Samsung and more. See prices instantly and book on WhatsApp. Most repairs done same day.",
  alternates: { canonical: "/repairs" },
};

const PERKS = [
  { icon: Stethoscope, label: "Free diagnosis" },
  { icon: Clock, label: "Most repairs same day" },
  { icon: BadgeCheck, label: "Original or high-grade parts" },
  { icon: ShieldCheck, label: "3-month repair warranty" },
];

const HOW = [
  { t: "Get a quote", d: "Pick your device and what's wrong. You'll see the price before you book." },
  { t: "Drop off or pickup", d: "Bring it to the store, or we collect it from you anywhere in Lagos." },
  { t: "Diagnose and fix", d: "We test it first and call you before doing anything that costs more." },
  { t: "Collect and go", d: "Test it in front of us, then pay. Every repair has a 3-month warranty." },
];

const FAQ = [
  {
    q: "Will I lose my data?",
    a: "Almost never. Screen, battery and port repairs don't touch your storage. For water damage and board repairs we'll tell you the risk first. Back up if you can.",
  },
  { q: "What if the price changes after diagnosis?", a: "We call or WhatsApp you before doing any extra work. If you say no, you pay nothing and take the phone back as it was." },
  { q: "Do you use original parts?", a: "We offer original parts where they're available, and tested high-grade parts otherwise. We'll tell you which, and the price of each, before we start." },
  { q: "My device isn't on the list.", a: "Choose \"Device not listed?\" and type it in. We repair most phones, tablets and smartwatches." },
];

export default async function RepairsPage() {
  const prices = await getRepairPrices();
  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface">
        <div className="container-site flex flex-col gap-5 py-8 md:py-12">
          <span className="font-mono text-micro tracking-[0.04em] text-muted">REPAIRS · LAGOS WORKSHOP</span>
          <h1 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">Fixed today, with a warranty.</h1>
          <p className="max-w-xl text-body text-muted">See your price in seconds, book on WhatsApp, and pay only when the repair is done and tested.</p>
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
        <RepairChecker prices={prices} />
      </div>

      <section className="container-site flex flex-col gap-6 pb-16 pt-4" aria-labelledby="how">
        <h2 id="how" className="h-section">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
