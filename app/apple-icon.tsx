import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** App icon: the lens g on an accent rounded square. */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2447F5", borderRadius: 40 }}>
      <svg width="78" height="104" viewBox="0 0 24 32" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="13" height="15" rx="4" />
        <path d="M16.5 8v14.5a6 6 0 0 1-6 6H7" />
        <circle cx="10" cy="11" r="2.2" fill="#FFFFFF" stroke="none" />
      </svg>
    </div>,
    size,
  );
}
