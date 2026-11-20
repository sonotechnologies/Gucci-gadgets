"use client";
import { ChevronRight, GitCompare, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useCart, useCompare, useHydrated } from "@/lib/stores";
import { waLink } from "@/lib/whatsapp";
import { Logo } from "./logo";
import { useSettings } from "./providers";
import { SearchOverlay, type SearchEntry } from "./search-overlay";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/deals", label: "Deals" },
  { href: "/swap", label: "Swap" },
  { href: "/repairs", label: "Repairs" },
];

export function SiteHeader({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const hydrated = useHydrated();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const bump = useCart((s) => s.bump);
  const openCart = useCart((s) => s.setOpen);
  const compareCount = useCompare((s) => s.items.length);
  const settings = useSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-btn focus:bg-bg focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className={cn("sticky top-0 z-40 border-b bg-bg transition-colors duration-200", scrolled ? "border-border" : "border-transparent")}>
        <div className={cn("container-site flex items-center gap-3 transition-[height] duration-200 ease-out", scrolled ? "h-14" : "h-[60px] md:h-[72px]")}>
          <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" className="icon-btn -ml-2.5 md:hidden">
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <Link href="/" aria-label="Gucci Gadgets home" className="flex hover:no-underline">
            <Logo size={scrolled ? 24 : 28} className="transition-all duration-200" />
          </Link>
          <nav aria-label="Main" className="hidden flex-1 justify-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center rounded-btn px-3.5 text-[15px] font-medium text-text hover:bg-surface-2 hover:no-underline",
                    active && "bg-surface-2",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-1 md:hidden" />
          <div className="-mr-2.5 flex items-center gap-0.5">
            <button type="button" onClick={() => setSearch(true)} aria-label="Search" className="icon-btn">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <ThemeToggle className="hidden md:inline-flex" />
            {hydrated && compareCount > 0 && (
              <Link href="/compare" aria-label={`Compare (${compareCount})`} className="icon-btn relative hidden hover:no-underline md:inline-flex">
                <GitCompare size={20} strokeWidth={1.5} />
                <span className="num absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-text px-1 text-[11px] font-medium text-bg">
                  {compareCount}
                </span>
              </Link>
            )}
            <button type="button" onClick={() => openCart(true)} aria-label={`Cart (${hydrated ? cartCount : 0} items)`} className="icon-btn relative">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {hydrated && cartCount > 0 && (
                <span
                  key={bump}
                  className="num absolute right-1 top-1 flex h-[18px] min-w-[18px] animate-bounce1 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium text-on-accent"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] flex animate-fade flex-col overflow-y-auto bg-bg px-4 pb-8">
          <div className="flex h-[60px] shrink-0 items-center justify-between">
            <Logo size={24} />
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="icon-btn -mr-2.5">
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col pt-4">
            {[...NAV, { href: "/compare", label: hydrated && compareCount ? `Compare (${compareCount})` : "Compare" }, { href: "/about", label: "About & delivery" }].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex h-[60px] items-center justify-between border-b border-border text-[24px] font-semibold text-text hover:no-underline"
              >
                {n.label}
                <ChevronRight size={20} strokeWidth={1.5} className="text-muted" />
              </Link>
            ))}
          </nav>
          <ThemeToggle variant="full" className="mt-6" />
          <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg mt-3 w-full hover:no-underline">
            <MessageCircle size={18} strokeWidth={1.5} />
            Chat on WhatsApp
          </a>
        </div>
      )}

      {search && <SearchOverlay entries={searchIndex} onClose={() => setSearch(false)} />}
    </>
  );
}
