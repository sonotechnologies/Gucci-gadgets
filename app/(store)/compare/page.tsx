import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";
import { isPhone } from "@/lib/catalog";
import { getProducts } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Compare phones",
  description: "Compare up to three phones side by side: display, chip, cameras, battery and condition.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const phones = (await getProducts()).filter(isPhone);
  return (
    <div className="container-site flex flex-col gap-6 py-6 md:py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">Compare phones</h1>
      </div>
      <CompareView phones={phones} />
    </div>
  );
}
