import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-ui";
import { RepairsTable } from "@/components/admin/repairs-table";
import { adminRepairPrices } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Repair prices" };

export default async function AdminRepairsPage() {
  const prices = await adminRepairPrices();
  return (
    <>
      <PageTitle>Repair prices</PageTitle>
      <RepairsTable prices={prices} />
    </>
  );
}
