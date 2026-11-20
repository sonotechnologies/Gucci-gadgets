import { BadgeCheck, Clock, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { displayPhone, waLink } from "@/lib/whatsapp";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "About, delivery and contact",
  description: "Who we are, how we test and grade phones, delivery across Nigeria, warranty, and how to reach Gucci Gadgets in Lagos.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const s = await getSettings();
  const blocks = [
    {
      icon: BadgeCheck,
      title: "How we test and grade",
      body: "Every UK-used phone goes through a full check before it's listed: screen, Face ID or fingerprint, cameras, speakers, microphones, charging, network and battery health. We grade it A+, A or B and write down anything you should know.",
    },
    {
      icon: ShieldCheck,
      title: "Warranty",
      body: "New phones carry a 12-month warranty. UK-used phones carry 3 to 6 months, shown on every product page. Repairs come with a 3-month warranty on the part we fitted.",
    },
    {
      icon: Truck,
      title: "Delivery",
      body: s.delivery_note + " You can also pick up from the store and test the phone before you pay.",
    },
  ];
  return (
    <div className="container-site flex flex-col gap-12 py-6 md:py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">About Gucci Gadgets</h1>
        <p className="text-[17px] leading-relaxed text-muted">
          We sell original new and UK-used phones, accessories and gadgets in Lagos, and we swap and repair phones too. The idea is simple: tell people exactly what
          they&rsquo;re buying, price it fairly, and stand behind it.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex flex-col gap-3 rounded-card border border-border p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <h2 className="text-h3 font-semibold">{title}</h2>
            <p className="text-[15px] leading-relaxed text-muted">{body}</p>
          </section>
        ))}
      </div>
      <section className="grid items-center gap-8 rounded-card bg-surface p-6 md:grid-cols-2 md:p-10">
        <div className="flex flex-col gap-4">
          <h2 className="h-section">Visit or get in touch</h2>
          <div className="flex gap-3">
            <MapPin size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            {s.store_address}
          </div>
          <div className="flex gap-3">
            <Clock size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            {s.opening_hours}
          </div>
          <div className="flex gap-3">
            <Phone size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            <span className="num">{displayPhone(s.whatsapp_number)}</span>
          </div>
          <a href={waLink(s.whatsapp_number, "Hello Gucci Gadgets 👋")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg self-start hover:no-underline">
            <MessageCircle size={18} strokeWidth={1.5} />
            Chat on WhatsApp
          </a>
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
