import { MessageCircle } from "lucide-react";
import Link from "next/link";
import type { Settings } from "@/lib/types";
import { displayPhone, waLink } from "@/lib/whatsapp";
import { Logo } from "./logo";

/** Simple Instagram glyph (lucide no longer ships brand icons). */
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter({ settings }: { settings: Settings }) {
  const cols = [
    {
      t: "Shop",
      l: [
        { href: "/shop/phones", label: "New phones" },
        { href: "/shop/uk-used", label: "UK-used" },
        { href: "/shop/accessories", label: "Accessories" },
        { href: "/shop/gadgets", label: "Gadgets" },
        { href: "/deals", label: "Flash deals" },
      ],
    },
    {
      t: "Services",
      l: [
        { href: "/swap", label: "Swap your phone" },
        { href: "/repairs", label: "Repairs" },
        { href: "/compare", label: "Compare phones" },
        { href: "/about", label: "Delivery & warranty" },
      ],
    },
  ];
  const ig = settings.instagram_handle.replace(/^@/, "");
  return (
    <footer className="mt-auto border-t border-border bg-bg">
      <div className="container-site grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo size={26} />
          <p className="max-w-[260px] text-small text-muted">New and UK-used phones, tested and graded in Lagos. Swaps and repairs too.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t} className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold">{c.t}</span>
            {c.l.map((l) => (
              <Link key={l.href} href={l.href} className="text-small text-muted hover:text-text">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold">Visit</span>
          <span className="text-small text-muted">{settings.store_address}</span>
          <span className="text-small text-muted">{settings.opening_hours}</span>
          <span className="num text-small text-muted">{displayPhone(settings.whatsapp_number)}</span>
        </div>
      </div>
      <div className="container-site flex flex-wrap items-center justify-between gap-3 border-t border-border pb-6 pt-4 text-[13px] text-muted">
        <span>
          © {new Date().getFullYear()} Gucci Gadgets · Built by Sono Technologies ·{" "}
          <a href="https://instagram.com/sonotechnologies.dev" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-text">
            @sonotechnologies.dev
          </a>
        </span>
        <div className="flex gap-1">
          {ig && (
            <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="icon-btn text-muted">
              <InstagramIcon />
            </a>
          )}
          <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="icon-btn text-muted">
            <MessageCircle size={18} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
