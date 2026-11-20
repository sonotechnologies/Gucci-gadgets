import { ChevronLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { adminProduct } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = id === "new" ? null : await adminProduct(id);
  if (id !== "new" && !product) notFound();
  return (
    <>
      <Link href="/admin/products" className="-mb-3 flex items-center gap-1.5 self-start text-small text-muted hover:text-text hover:no-underline">
        <ChevronLeft size={16} strokeWidth={1.5} />
        Products
      </Link>
      <PageTitle
        action={
          product && (
            <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-ghost text-small hover:no-underline">
              <ExternalLink size={16} strokeWidth={1.5} />
              View
            </Link>
          )
        }
      >
        {product ? product.name : "New product"}
      </PageTitle>
      <ProductForm product={product} />
    </>
  );
}
