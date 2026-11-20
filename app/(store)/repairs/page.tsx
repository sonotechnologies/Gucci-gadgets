import type { Metadata } from "next";
import { RepairChecker } from "@/components/repairs/repair-checker";
import { getRepairPrices } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Phone repairs in Lagos",
  description: "Screen, battery, charging port, camera and Face ID repairs for iPhone and Samsung. See prices instantly and book on WhatsApp. Most repairs done same day.",
  alternates: { canonical: "/repairs" },
};

export default async function RepairsPage() {
  const prices = await getRepairPrices();
  return (
    <div className="container-site flex flex-col gap-8 py-6 md:py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-h1">Repairs</h1>
        <p className="max-w-2xl text-body text-muted">Original or high-grade parts, fitted in our Lagos workshop. Most repairs are done the same day.</p>
      </div>
      <RepairChecker prices={prices} />
    </div>
  );
}
