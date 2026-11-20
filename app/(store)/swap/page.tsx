import type { Metadata } from "next";
import { SwapEstimator } from "@/components/swap/swap-estimator";
import { isInStock, isPhone } from "@/lib/catalog";
import { getProducts, getSwapValues } from "@/lib/data";

export const metadata: Metadata = {
  title: "Swap your phone",
  description: "Find out what your old iPhone or Samsung is worth in under a minute, then trade it in towards any phone in the store.",
  alternates: { canonical: "/swap" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SwapPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [values, products] = await Promise.all([getSwapValues(), getProducts()]);
  const phones = products.filter((p) => isPhone(p) && isInStock(p));
  return (
    <div className="container-site flex flex-col gap-7 py-6 md:py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">Swap your phone</h1>
        <p className="text-body text-muted">Answer a few quick questions. Your estimate updates as you go.</p>
      </div>
      <SwapEstimator values={values} phones={phones} initial={{ brand: one(sp.brand), model: one(sp.model), target: one(sp.target) }} />
    </div>
  );
}
