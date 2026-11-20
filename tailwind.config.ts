import type { Config } from "tailwindcss";

// Every colour comes from a CSS variable defined in app/globals.css.
// Never hard-code hex values in components.
const v = (name: string) => `var(--${name})`;

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        border: v("border"),
        text: v("text"),
        muted: v("text-muted"),
        accent: v("accent"),
        "accent-soft": v("accent-soft"),
        "on-accent": v("on-accent"),
        deal: v("deal"),
        success: v("success"),
        warning: v("warning"),
        whatsapp: v("whatsapp"),
        ink: v("ink"),
        scrim: v("scrim"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        micro: ["12px", "16px"],
        small: ["14px", "20px"],
        body: ["16px", "24px"],
        h3: ["18px", "26px"],
        h2: ["24px", "30px"],
        h1: ["32px", "38px"],
      },
      borderRadius: { card: "12px", btn: "10px" },
      maxWidth: { site: "1280px" },
      transitionTimingFunction: { out: "cubic-bezier(0.16, 1, 0.3, 1)" },
      keyframes: {
        bounce1: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.35)" }, "100%": { transform: "scale(1)" } },
        rise: { from: { transform: "translateY(12px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        bounce1: "bounce1 250ms ease-out",
        rise: "rise 200ms ease-out",
        fade: "fade 200ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
