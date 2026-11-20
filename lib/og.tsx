/** Shared Open Graph card (1200×630) for WhatsApp / social previews. Inline styles only (next/og). */
export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard({ title, subtitle, price, badge }: { title: string; subtitle: string; price?: string; badge?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFFFFF", padding: 72, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="42" height="56" viewBox="0 0 24 32" fill="none" stroke="#2447F5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="13" height="15" rx="4" />
          <path d="M16.5 8v14.5a6 6 0 0 1-6 6H7" />
          <circle cx="10" cy="11" r="2.2" fill="#2447F5" stroke="none" />
        </svg>
        <div style={{ display: "flex", fontSize: 40, color: "#0E0F12", letterSpacing: -1 }}>
          <span style={{ fontWeight: 700 }}>Gucci</span>
          <span style={{ marginLeft: 10 }}>Gadgets</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {badge && (
          <div style={{ display: "flex" }}>
            <span style={{ background: "#E8EDFF", color: "#0E0F12", fontSize: 28, padding: "8px 20px", borderRadius: 999 }}>{badge}</span>
          </div>
        )}
        <div style={{ fontSize: 76, fontWeight: 700, color: "#0E0F12", letterSpacing: -2, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 34, color: "#5B616E" }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 44, color: "#2447F5", fontWeight: 700 }}>{price ?? ""}</span>
        <span style={{ fontSize: 28, color: "#5B616E" }}>Order on WhatsApp · Lagos</span>
      </div>
    </div>
  );
}
