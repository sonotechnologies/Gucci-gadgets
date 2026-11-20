import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gucci Gadgets",
    short_name: "Gucci Gadgets",
    description: "Original phones. Honest grades. Lagos prices.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#2447F5",
    icons: [{ src: "/gg-app-icon-512.svg", sizes: "512x512", type: "image/svg+xml" }],
  };
}
