import type { Metadata } from "next";
import { CartPanel } from "@/components/cart";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-site flex justify-center py-6 md:py-10">
      <div className="w-full max-w-[560px]">
        <CartPanel variant="page" />
      </div>
    </div>
  );
}
