import { CartDrawer } from "@/components/cart";
import { Toast, WhatsAppFab } from "@/components/chrome";
import { CompareTray } from "@/components/compare-tray";
import type { SearchEntry } from "@/components/search-overlay";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { conditionLabel, fromPrice, storages } from "@/lib/catalog";
import { getProducts, getSettings } from "@/lib/data";

export const revalidate = 60;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const searchIndex: SearchEntry[] = products.map((p) => {
    const chip = conditionLabel(p);
    const st = storages(p);
    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      chip,
      storages: st,
      price: fromPrice(p),
      image: p.images[0] ?? null,
      category: p.category,
      haystack: [p.name, p.brand, chip, p.category, ...st, ...st.map((s) => s.replace(/GB$/, ""))].join(" ").toLowerCase(),
    };
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader searchIndex={searchIndex} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <CompareTray />
      <WhatsAppFab />
      <CartDrawer />
      <Toast />
    </div>
  );
}
