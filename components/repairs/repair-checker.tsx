"use client";
import { BatteryLow, Camera, Clock, Droplets, Layers, MessageCircle, PlugZap, ScanFace, Search, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { formatNaira } from "@/lib/format";
import { REPAIR_ISSUES, type RepairIssue, type RepairPrice } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { useSettings } from "../providers";
import { OptionCard, Segmented } from "../ui";

const ISSUE_ICONS: Record<RepairIssue, typeof Smartphone> = {
  Screen: Smartphone,
  Battery: BatteryLow,
  "Charging port": PlugZap,
  "Back glass": Layers,
  Camera: Camera,
  "Face ID": ScanFace,
  "Water damage": Droplets,
};

const formSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number"),
});

export function RepairChecker({ prices }: { prices: RepairPrice[] }) {
  const settings = useSettings();
  const devices = useMemo(() => [...new Set(prices.map((p) => `${p.model}`))], [prices]);
  const [device, setDevice] = useState<string | null>(null);
  const [issue, setIssue] = useState<RepairIssue | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", note: "", mode: "Drop-off" as "Drop-off" | "Pickup" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [q, setQ] = useState("");

  const issuesFor = (d: string | null) => new Set(prices.filter((p) => p.model === d).map((p) => p.issue));
  const avail = issuesFor(device);
  const match = prices.find((p) => p.model === device && p.issue === issue);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return prices.filter((p) => !t || `${p.brand} ${p.model} ${p.issue}`.toLowerCase().includes(t));
  }, [prices, q]);

  const msg = [
    "Hello Gucci Gadgets 👋",
    "I'd like to book a repair.",
    `Device: ${device ?? "…"}`,
    `Issue: ${issue ?? "…"}`,
    match ? `Quoted: from ${formatNaira(match.price_from)} · ${match.duration}` : null,
    form.note.trim() ? `Details: ${form.note.trim()}` : null,
    `Name: ${form.name.trim() || "…"}`,
    `Phone: ${form.phone.trim() || "…"}`,
    `${form.mode === "Pickup" ? "Please pick it up from me" : "I'll drop it off at the store"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const send = () => {
    const r = formSchema.safeParse(form);
    if (!r.success) {
      const e: typeof errors = {};
      r.error.issues.forEach((i) => (e[i.path[0] as "name" | "phone"] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    window.open(waLink(settings.whatsapp_number, msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-h3 font-semibold">1. Your device</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {devices.map((d) => (
            <OptionCard
              key={d}
              selected={d === device}
              onClick={() => {
                setDevice(d);
                if (issue && !issuesFor(d).has(issue)) setIssue(null);
              }}
              icon={<Smartphone size={20} strokeWidth={1.5} />}
            >
              {d}
            </OptionCard>
          ))}
        </div>
        <p className="text-[13px] text-muted">Don&rsquo;t see your phone? Pick the closest one and tell us the exact model below.</p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-h3 font-semibold">2. What needs fixing?</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {REPAIR_ISSUES.map((i) => {
            const Icon = ISSUE_ICONS[i];
            const disabled = !!device && !avail.has(i);
            return (
              <OptionCard
                key={i}
                selected={i === issue}
                onClick={() => !disabled && setIssue(i)}
                layout="column"
                icon={<Icon size={24} strokeWidth={1.5} />}
                className={disabled ? "cursor-not-allowed opacity-40" : undefined}
              >
                {i}
              </OptionCard>
            );
          })}
        </div>
      </fieldset>

      {device && issue && (
        <div className="grid animate-rise items-start gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2.5 rounded-card bg-accent-soft p-6">
            <span className="text-small text-muted">
              {device} · {issue}
            </span>
            {match ? (
              <>
                <span className="num text-[32px] font-medium leading-tight text-accent">From {formatNaira(match.price_from)}</span>
                <span className="flex items-center gap-2 text-[15px] font-medium">
                  <Clock size={16} strokeWidth={1.5} />
                  {match.duration}
                </span>
              </>
            ) : (
              <span className="text-h3 font-semibold">Price on inspection</span>
            )}
            <span className="text-[13px] leading-normal text-muted">Final price depends on your exact model. Free diagnosis, and a 3-month warranty on the repair.</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex flex-col gap-3.5 rounded-card border border-border p-6"
          >
            <h2 className="text-h3 font-semibold">3. Request a repair</h2>
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
            <label className="field">
              What&rsquo;s wrong? (optional)
              <textarea
                className="input h-auto min-h-[88px] py-2.5"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. dropped it, screen flickers"
                rows={3}
              />
            </label>
            <div className="field">
              Drop-off or pickup?
              <Segmented
                label="Drop-off or pickup"
                value={form.mode}
                onChange={(mode) => setForm({ ...form, mode })}
                options={[
                  { value: "Drop-off", label: "Drop-off" },
                  { value: "Pickup", label: "Pickup" },
                ]}
              />
            </div>
            <button type="submit" className="btn btn-whatsapp h-[52px] text-body">
              <MessageCircle size={18} strokeWidth={1.5} />
              Send request on WhatsApp
            </button>
          </form>
        </div>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="price-list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="price-list" className="h-section">
            Price list
          </h2>
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Search repairs</span>
            <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device or repair" className="input pl-10" type="search" />
          </label>
        </div>
        <div className="overflow-hidden rounded-card border border-border">
          <table className="w-full text-left text-small">
            <thead className="bg-surface text-[13px] font-semibold text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Device
                </th>
                <th scope="col" className="px-4 py-3">
                  Repair
                </th>
                <th scope="col" className="px-4 py-3">
                  From
                </th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.model}</td>
                  <td className="px-4 py-3">{r.issue}</td>
                  <td className="num px-4 py-3">{formatNaira(r.price_from)}</td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{r.duration}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={4} className="px-4 py-6 text-muted">
                    No repairs match that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
