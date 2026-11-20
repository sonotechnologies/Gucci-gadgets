import { cn } from "@/lib/cn";

/**
 * Logo concept 1a — "Lens g": a phone-outline bowl with a camera-lens dot.
 * Paths use currentColor so the logo follows the theme automatically.
 */
export function LogoIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      width={size * 0.75}
      height={size}
      className={cn("block shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="13" height="15" rx="4" />
      <path d="M16.5 8v14.5a6 6 0 0 1-6 6H7" />
      <circle cx="10" cy="11" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo({
  size = 28,
  layout = "horizontal",
  className,
  iconClassName = "text-accent",
}: {
  size?: number;
  layout?: "horizontal" | "stacked" | "icon";
  className?: string;
  iconClassName?: string;
}) {
  if (layout === "icon") return <LogoIcon size={size} className={iconClassName} />;
  const stacked = layout === "stacked";
  return (
    <span
      className={cn("inline-flex items-center leading-none text-text", stacked && "flex-col", className)}
      style={{ gap: stacked ? size * 0.3 : size * 0.28 }}
    >
      <LogoIcon size={size} className={iconClassName} />
      <span className="whitespace-nowrap tracking-[-0.02em]" style={{ fontSize: stacked ? size * 0.55 : size * 0.68 }}>
        <span className="font-semibold">Gucci</span> <span className="font-normal">Gadgets</span>
      </span>
    </span>
  );
}
