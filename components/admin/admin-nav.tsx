"use client";
import { ArrowLeftRight, ExternalLink, LayoutDashboard, LogOut, Package, Settings, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";

export const ADMIN_TABS = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", short: "Products", icon: Package },
  { href: "/admin/swap", label: "Swap values", short: "Swap", icon: ArrowLeftRight },
  { href: "/admin/repairs", label: "Repairs", short: "Repairs", icon: Wrench },
  { href: "/admin/settings", label: "Settings", short: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar({ email, demo }: { email: string | null; demo: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-bg px-3 py-5 md:flex">
      <div className="flex flex-col gap-1 px-2">
        <Logo size={24} />
        <span className="pl-0.5 font-mono text-micro text-muted">ADMIN</span>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-0.5">
        {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
          const on = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-btn px-3 text-[15px] font-medium hover:bg-surface-2 hover:no-underline",
                on ? "bg-accent-soft text-accent" : "text-text",
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        <ThemeToggle variant="sidebar" />
        <Link href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-btn px-3 text-small text-muted hover:bg-surface-2 hover:no-underline">
          <ExternalLink size={18} strokeWidth={1.5} />
          View store
        </Link>
        {!demo && (
          <form action={signOut}>
            <button type="submit" className="flex h-11 w-full items-center gap-3 rounded-btn px-3 text-small text-muted hover:bg-surface-2">
              <LogOut size={18} strokeWidth={1.5} />
              Sign out
            </button>
          </form>
        )}
        {email && <span className="truncate px-3 pt-1 text-micro text-muted">{email}</span>}
      </div>
    </aside>
  );
}

export function AdminBottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ADMIN_TABS.map(({ href, short, icon: Icon }) => {
        const on = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn("flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium hover:no-underline", on ? "text-accent" : "text-muted")}
          >
            <Icon size={20} strokeWidth={1.5} />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileTop({ demo }: { demo: boolean }) {
  return (
    <div className="flex items-center justify-between md:hidden">
      <Logo size={20} />
      <div className="-mr-2.5 flex items-center">
        <ThemeToggle />
        {!demo && (
          <form action={signOut}>
            <button type="submit" aria-label="Sign out" className="icon-btn">
              <LogOut size={20} strokeWidth={1.5} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
