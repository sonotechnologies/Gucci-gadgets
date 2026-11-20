import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-ui";
import { SwapTable } from "@/components/admin/swap-table";
import { adminSwapValues } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Swap values" };

export default async function AdminSwapPage() {
  const values = await adminSwapValues();
  return (
    <>
      <PageTitle>Swap values</PageTitle>
      <SwapTable values={values} />
    </>
  );
}
