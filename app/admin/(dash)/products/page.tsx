import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductsTable } from "@/components/admin/products-table";
import { PageTitle } from "@/components/admin/admin-ui";
import { adminProducts } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const [products, { filter }] = await Promise.all([adminProducts(), searchParams]);
  return (
    <>
      <PageTitle
        action={
          <Link href="/admin/products/new" className="btn btn-primary hover:no-underline">
            <Plus size={18} strokeWidth={1.75} />
            <span className="hidden sm:inline">Add product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        }
      >
        Products
      </PageTitle>
      <ProductsTable products={products} initialFilter={filter === "out" || filter === "deals" ? filter : "all"} />
    </>
  );
}
