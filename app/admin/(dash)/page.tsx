import { AlertTriangle, Package, PackageX, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { AdminCard, PageTitle } from "@/components/admin/admin-ui";
import { ProductImage } from "@/components/product-image";
import { isDealActive, isInStock } from "@/lib/catalog";
import { adminProducts } from "@/lib/admin/data";

export default async function DashboardPage() {
  const products = await adminProducts();
  const active = products.filter((p) => p.is_active);
  const outOfStock = active.filter((p) => !isInStock(p));
  const deals = active.filter((p) => isDealActive(p));
  const lowStock = active
    .flatMap((p) => p.variants.filter((v) => v.in_stock && v.stock_qty > 0 && v.stock_qty <= 2).map((v) => ({ p, v })))
    .slice(0, 8);

  const kpis = [
    { label: "Products", value: active.length, icon: Package, href: "/admin/products" },
    { label: "Out of stock", value: outOfStock.length, icon: PackageX, href: "/admin/products?filter=out" },
    { label: "Active deals", value: deals.length, icon: Tag, href: "/admin/products?filter=deals" },
  ];

  return (
    <>
      <PageTitle
        action={
          <Link href="/admin/products/new" className="btn btn-primary hover:no-underline">
            <Plus size={18} strokeWidth={1.75} />
            Add product
          </Link>
        }
      >
        Dashboard
      </PageTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="flex flex-col gap-2 rounded-card border border-border bg-bg p-[18px] text-text hover:bg-surface hover:no-underline">
            <span className="flex items-center gap-2 text-[13px] text-muted">
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </span>
            <span className="num text-[28px] font-medium">{value}</span>
          </Link>
        ))}
      </div>

      <AdminCard className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-[18px] py-4 text-body font-semibold">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-warning" />
          Running low (2 or fewer left)
        </div>
        {lowStock.length ? (
          lowStock.map(({ p, v }) => (
            <Link key={v.id} href={`/admin/products/${p.id}`} className="flex items-center gap-3 border-b border-border px-[18px] py-3 text-text last:border-0 hover:bg-surface hover:no-underline">
              <ProductImage src={p.images[0]} alt="" category={p.category} sizes="40px" className="h-10 w-10 shrink-0 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-medium">{p.name}</span>
                <span className="text-[13px] text-muted">{[v.storage, v.colour].filter(Boolean).join(" · ") || "Default"}</span>
              </span>
              <span className="num text-small text-warning">{v.stock_qty} left</span>
            </Link>
          ))
        ) : (
          <p className="px-[18px] py-6 text-small text-muted">Nothing is running low.</p>
        )}
      </AdminCard>

      {outOfStock.length > 0 && (
        <AdminCard className="overflow-hidden">
          <div className="border-b border-border px-[18px] py-4 text-body font-semibold">Out of stock</div>
          {outOfStock.map((p) => (
            <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between border-b border-border px-[18px] py-3 text-text last:border-0 hover:bg-surface hover:no-underline">
              <span className="text-[15px]">{p.name}</span>
              <span className="text-small text-accent">Restock</span>
            </Link>
          ))}
        </AdminCard>
      )}
    </>
  );
}
