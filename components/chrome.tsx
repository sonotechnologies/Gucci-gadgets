"use client";
import { CircleCheck, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useCompare, useHydrated, useToast } from "@/lib/stores";
import { waLink } from "@/lib/whatsapp";
import { useSettings } from "./providers";

export function Toast() {
  const message = useToast((s) => s.message);
  const id = useToast((s) => s.id);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4">
      {message && (
        <div key={id} className="flex animate-rise items-center gap-2 rounded-btn bg-text px-[18px] py-3 text-small font-medium text-bg shadow-[0_8px_24px_rgba(0,0,0,.18)]">
          <CircleCheck size={18} strokeWidth={1.75} />
          {message}
        </div>
      )}
    </div>
  );
}

/** Floating WhatsApp button (every page except admin). Moves up when the compare tray or a sticky bar is showing. */
export function WhatsAppFab() {
  const settings = useSettings();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const trayUp = useCompare((s) => s.items.length > 0) && hydrated && pathname !== "/compare";
  // Pages with their own WhatsApp action on mobile: hide the floating button there.
  const ownCta = pathname.startsWith("/product/") || pathname === "/swap" || pathname === "/repairs" || pathname === "/cart";
  const hasBottomBar = false;
  return (
    <a
      href={waLink(settings.whatsapp_number, "Hello Gucci Gadgets 👋")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-ink shadow-[0_6px_20px_rgba(0,0,0,.18)] transition-[bottom] duration-200 ease-out hover:no-underline md:right-5",
        trayUp ? "bottom-[92px]" : hasBottomBar ? "bottom-[92px] md:bottom-5" : "bottom-5",
        ownCta && "max-md:hidden",
      )}
    >
      <MessageCircle size={24} strokeWidth={1.75} />
    </a>
  );
}
