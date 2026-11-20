"use client";
import { CheckCircle2, ChevronLeft, Copy, MessageCircle, Minus, Plus, Send, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toOrderLine } from "@/lib/cart-item";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useCart, useHydrated } from "@/lib/stores";
import { LAGOS_AREAS, orderMessage, waLink, type DeliveryMode } from "@/lib/whatsapp";
import { ProductImage } from "./product-image";
import { useSettings } from "./providers";
import { Segmented } from "./ui";

type Step = "cart" | "form" | "sent";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number"),
  area: z.string().min(1),
  mode: z.enum(["Delivery", "Pickup"]),
});

const CO_KEY = "gg-checkout";

/** Cart contents + checkout form + WhatsApp confirmation. Used by the drawer and /cart. */
export function CartPanel({ variant, onClose }: { variant: "drawer" | "page"; onClose?: () => void }) {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const hydrated = useHydrated();
  const settings = useSettings();
  const [step, setStep] = useState<Step>("cart");
  const [co, setCo] = useState({ name: "", phone: "", area: "Lekki", mode: "Delivery" as DeliveryMode });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof co, string>>>({});
  const [sentMsg, setSentMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Remember checkout details on this device for next time.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CO_KEY);
      if (saved) setCo((c) => ({ ...c, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const lines = items.map(toOrderLine);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const msg = orderMessage(lines, co);

  const send = () => {
    const r = checkoutSchema.safeParse(co);
    if (!r.success) {
      const e: typeof errors = {};
      r.error.issues.forEach((i) => (e[i.path[0] as keyof typeof co] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    try {
      localStorage.setItem(CO_KEY, JSON.stringify(co));
    } catch {}
    window.open(waLink(settings.whatsapp_number, msg), "_blank", "noopener,noreferrer");
    setSentMsg(msg);
    setStep("sent");
    clear();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sentMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const title = step === "form" ? "Checkout" : step === "sent" ? "Order sent" : "Your cart";
  const isEmpty = hydrated && items.length === 0 && step !== "sent";

  return (
    <div className={cn("flex min-h-0 flex-col", variant === "drawer" ? "h-full" : "card")}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          {step === "form" && (
            <button type="button" onClick={() => setStep("cart")} aria-label="Back to cart" className="icon-btn -ml-3">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
          )}
          <h2 className="text-h3 font-semibold">{title}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close cart" className="icon-btn -mr-3">
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        {!hydrated && <div className="h-24 animate-pulse rounded-card bg-surface" />}

        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <ShoppingBag size={40} strokeWidth={1.25} className="text-muted" />
            <span className="text-body font-medium">Your cart is empty</span>
            <span className="text-small text-muted">Phones you add will show up here.</span>
            <Link href="/shop" onClick={onClose} className="btn btn-primary hover:no-underline">
              Shop phones
            </Link>
          </div>
        )}

        {hydrated && step === "cart" &&
          items.map((i) => (
            <div key={i.key} className="flex items-start gap-3">
              <ProductImage src={i.image} alt="" sizes="72px" className="h-[72px] w-[72px] shrink-0 rounded-btn" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex justify-between gap-2">
                  <Link href={`/product/${i.slug}`} onClick={onClose} className="text-[15px] font-medium text-text">
                    {i.name}
                  </Link>
                  <span className="num whitespace-nowrap text-small font-medium">{formatNaira(i.unitPrice * i.qty)}</span>
                </div>
                <span className="text-[13px] text-muted">{[i.storage, i.colour, i.chip].filter(Boolean).join(" · ")}</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-btn border border-border">
                    <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`Decrease ${i.name}`} className="flex h-9 w-10 items-center justify-center">
                      <Minus size={14} strokeWidth={1.75} />
                    </button>
                    <span className="num min-w-6 text-center text-small" aria-live="polite">
                      {i.qty}
                    </span>
                    <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={`Increase ${i.name}`} className="flex h-9 w-10 items-center justify-center">
                      <Plus size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(i.key)} className="h-9 text-[13px] text-muted hover:text-text">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

        {hydrated && step === "form" && (
          <>
            <label className="field">
              Full name
              <input className="input" value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} placeholder="Adaeze Okafor" autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <span className="text-[13px] text-deal">{errors.name}</span>}
            </label>
            <label className="field">
              Phone number
              <input
                className="input font-mono"
                value={co.phone}
                onChange={(e) => setCo({ ...co, phone: e.target.value })}
                placeholder="0803 000 0000"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <span className="text-[13px] text-deal">{errors.phone}</span>}
            </label>
            <div className="field">
              How do you want it?
              <Segmented
                label="Delivery or pickup"
                value={co.mode}
                onChange={(mode) => setCo({ ...co, mode })}
                options={[
                  { value: "Delivery", label: "Delivery" },
                  { value: "Pickup", label: "Pickup" },
                ]}
              />
            </div>
            {co.mode === "Delivery" ? (
              <label className="field">
                Delivery area
                <select className="input" value={co.area} onChange={(e) => setCo({ ...co, area: e.target.value })}>
                  {LAGOS_AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
                <span className="text-micro">{settings.delivery_note}</span>
              </label>
            ) : (
              <p className="text-small text-muted">Pick up at {settings.store_address}. {settings.opening_hours}.</p>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted">Message preview</span>
              <div className="max-w-[92%] self-end whitespace-pre-wrap rounded-[12px_12px_4px_12px] border border-border bg-surface px-3.5 py-3 text-small leading-normal">{msg}</div>
            </div>
          </>
        )}

        {step === "sent" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={44} strokeWidth={1.25} className="text-success" />
            <span className="text-h3 font-semibold">WhatsApp is opening</span>
            <span className="max-w-xs text-small text-muted">Send the message in WhatsApp and we&rsquo;ll confirm stock, delivery time and payment details there.</span>
            <div className="mt-2 flex w-full flex-col gap-2">
              <a href={waLink(settings.whatsapp_number, sentMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg w-full hover:no-underline">
                <MessageCircle size={18} strokeWidth={1.5} />
                Open WhatsApp again
              </a>
              <button type="button" onClick={copy} className="btn btn-secondary btn-lg w-full">
                <Copy size={18} strokeWidth={1.5} />
                {copied ? "Copied" : "Didn’t open? Copy order text"}
              </button>
            </div>
            <div className="mt-2 w-full whitespace-pre-wrap rounded-card border border-border bg-surface p-3 text-left text-[13px] text-muted">{sentMsg}</div>
          </div>
        )}
      </div>

      {hydrated && items.length > 0 && step !== "sent" && (
        <div className="flex flex-col gap-3 border-t border-border px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] text-muted">Subtotal</span>
            <span className="num text-[20px] font-medium">{formatNaira(subtotal)}</span>
          </div>
          {step === "cart" ? (
            <button type="button" onClick={() => setStep("form")} className="btn btn-whatsapp h-[52px] w-full text-body">
              <MessageCircle size={18} strokeWidth={1.5} />
              Checkout on WhatsApp
            </button>
          ) : (
            <button type="button" onClick={send} className="btn btn-whatsapp h-[52px] w-full text-body">
              <Send size={18} strokeWidth={1.5} />
              Send order on WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Slide-out drawer from the right on desktop, bottom sheet on mobile. */
export function CartDrawer() {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn("fixed inset-0 z-50 bg-scrim transition-opacity duration-200 ease-out", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed z-[51] flex flex-col bg-bg shadow-[0_0_40px_rgba(0,0,0,.15)] transition-transform duration-[250ms] ease-out",
          "inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none",
          open ? "translate-x-0 translate-y-0" : "translate-y-full md:translate-x-full md:translate-y-0",
        )}
      >
        {open && <CartPanel variant="drawer" onClose={() => setOpen(false)} />}
      </aside>
    </>
  );
}
